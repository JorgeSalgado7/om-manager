import { jest } from '@jest/globals'
import * as uuid from 'uuid'

// Mockeamos módulos antes de importar el código
jest.unstable_mockModule('@aws-sdk/lib-dynamodb', () => {
  const actual = jest.requireActual('@aws-sdk/lib-dynamodb')
  return {
    ...actual,
    DynamoDBDocumentClient: {
      from: jest.fn(),
    },
    PutCommand: actual.PutCommand || class PutCommand {},
    ScanCommand: actual.ScanCommand || class ScanCommand {},
  }
})

jest.unstable_mockModule('uuid', () => ({
  v4: jest.fn(),
}))

const { createOrganization } = await import('./createOrganization.js')
const { notificationResponse } = await import('../utils/notificationResponse.js')
const libDynamoDB = await import('@aws-sdk/lib-dynamodb')
const uuidModule = await import('uuid')

describe('createOrganization Lambda', () => {
  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterAll(() => {
    console.error.mockRestore()
  })

  const mockHeaders = {
    'Content-Type': 'application/json',
  }

  const mockSend = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    libDynamoDB.DynamoDBDocumentClient.from.mockReturnValue({
      send: mockSend,
    })
  })

  it('should create organization and memberOrg, returning 201', async () => {
    const orgId = 'uuid-org-1234'
    const memberOrgId = 'uuid-memberOrg-5678'
    uuidModule.v4.mockImplementationOnce(() => orgId).mockImplementationOnce(() => memberOrgId)

    mockSend.mockImplementationOnce(() => Promise.resolve({ Items: [{ id: 'member123' }] })) // ScanCommand
    mockSend.mockImplementationOnce(() => Promise.resolve()) // PutCommand organization
    mockSend.mockImplementationOnce(() => Promise.resolve()) // PutCommand memberOrg

    const event = { body: JSON.stringify({ name: 'Org1', email: 'test@example.com' }) }
    const response = await createOrganization(event, mockHeaders)
    const body = JSON.parse(response.body)

    expect(response.statusCode).toBe(201)
    expect(body.notification.error).toBe(false)
    expect(body.data).toEqual(expect.objectContaining({ id: orgId, name: 'Org1' }))
    expect(mockSend).toHaveBeenCalledTimes(3)
  })

  it('should return 400 if name or email are missing', async () => {
    const event = { body: JSON.stringify({ name: '', email: '' }) }
    const response = await createOrganization(event, mockHeaders)
    const body = JSON.parse(response.body)

    expect(response.statusCode).toBe(400)
    expect(body.notification.error).toBe(true)
    expect(body.notification.message).toBe('Name and email are required')
  })

  it('should return 404 if member not found', async () => {
    mockSend.mockImplementationOnce(() => Promise.resolve({ Items: [] })) // ScanCommand no encuentra

    const event = { body: JSON.stringify({ name: 'Org1', email: 'notfound@example.com' }) }
    const response = await createOrganization(event, mockHeaders)
    const body = JSON.parse(response.body)

    expect(response.statusCode).toBe(404)
    expect(body.notification.error).toBe(true)
    expect(body.notification.message).toBe('Member with this email not found')
  })

  it('should return 409 if ConditionalCheckFailedException error', async () => {
    mockSend.mockImplementationOnce(() => Promise.resolve({ Items: [{ id: 'member123' }] })) // ScanCommand
    const error = new Error('Conditional check failed')
    error.name = 'ConditionalCheckFailedException'
    mockSend.mockImplementationOnce(() => Promise.reject(error)) // PutCommand organization fails here

    const event = { body: JSON.stringify({ name: 'Org1', email: 'test@example.com' }) }
    const response = await createOrganization(event, mockHeaders)
    const body = JSON.parse(response.body)

    expect(response.statusCode).toBe(409)
    expect(body.notification.error).toBe(true)
    expect(body.notification.message).toBe('Organization with this ID already exists')
  })

  it('should return 500 on unexpected error', async () => {
    mockSend.mockRejectedValueOnce(new Error('Unexpected error')) // Error en scan

    const event = { body: JSON.stringify({ name: 'Org1', email: 'test@example.com' }) }
    const response = await createOrganization(event, mockHeaders)
    const body = JSON.parse(response.body)

    expect(response.statusCode).toBe(500)
    expect(body.notification.error).toBe(true)
    expect(body.notification.message).toBe('Internal Server Error')
  })
})
