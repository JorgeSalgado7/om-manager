// member/createMember.test.js
import { jest } from '@jest/globals'

// Mockeamos el módulo antes de importar el código que lo usa
jest.unstable_mockModule('@aws-sdk/lib-dynamodb', () => {
  return {
    DynamoDBDocumentClient: {
      from: jest.fn(),
    },
    // Mock simple para PutCommand, solo la clase vacía para que exista
    PutCommand: class PutCommand {},
  }
})

// Importamos dinámicamente después de mockear
const { createMember } = await import('./createMember.js')
const { notificationResponse } = await import('../utils/notificationResponse.js')
const libDynamoDB = await import('@aws-sdk/lib-dynamodb')

describe('createMember Lambda', () => {
  const mockHeaders = {
    'Content-Type': 'application/json',
  }

  const mockSend = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    // Mockeamos que DynamoDBDocumentClient.from() devuelve un objeto con método send mockeado
    libDynamoDB.DynamoDBDocumentClient.from.mockReturnValue({
      send: mockSend,
    })
  })

  it('should return 400 if email is missing', async () => {
    const event = { body: JSON.stringify({}) }
    const response = await createMember(event, mockHeaders)
    const body = JSON.parse(response.body)

    expect(response.statusCode).toBe(400)
    expect(body.notification.error).toBe(true)
    expect(body.notification.message).toBe('Email required')
  })

  it('should return 201 and create member', async () => {
    mockSend.mockResolvedValueOnce({})

    const event = { body: JSON.stringify({ email: 'test@example.com' }) }
    const response = await createMember(event, mockHeaders)
    const body = JSON.parse(response.body)

    expect(mockSend).toHaveBeenCalledTimes(1)
    expect(response.statusCode).toBe(201)
    expect(body.notification.error).toBe(false)
    expect(body.data.email).toBe('test@example.com')
    expect(body.data.id).toBeDefined()
    expect(body.data.status).toBe('active')
    expect(body.data.created_at).toBeDefined()
    expect(body.data.updated_at).toBeDefined()
  })

  it('should return 409 if email already exists', async () => {
    const conflictError = new Error('Conditional check failed')
    conflictError.name = 'ConditionalCheckFailedException'

    mockSend.mockRejectedValueOnce(conflictError)

    const event = { body: JSON.stringify({ email: 'duplicate@example.com' }) }
    const response = await createMember(event, mockHeaders)
    const body = JSON.parse(response.body)

    expect(response.statusCode).toBe(409)
    expect(body.notification.error).toBe(true)
    expect(body.notification.message).toBe('Member with this email already exists')
  })

  it('should return 500 on unexpected error', async () => {
    mockSend.mockRejectedValueOnce(new Error('Unexpected failure'))

    const event = { body: JSON.stringify({ email: 'test@example.com' }) }
    const response = await createMember(event, mockHeaders)
    const body = JSON.parse(response.body)

    expect(response.statusCode).toBe(500)
    expect(body.notification.error).toBe(true)
    expect(body.notification.message).toBe('Internal Server Error')
  })
})
