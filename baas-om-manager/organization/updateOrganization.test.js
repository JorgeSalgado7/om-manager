import { jest } from '@jest/globals'

jest.unstable_mockModule('@aws-sdk/lib-dynamodb', () => {
  const actual = jest.requireActual('@aws-sdk/lib-dynamodb')
  return {
    ...actual,
    DynamoDBDocumentClient: {
      from: jest.fn(),
    },
    UpdateCommand: actual.UpdateCommand || class UpdateCommand {},
  }
})

const { updateOrganization } = await import('./updateOrganization.js')
const { notificationResponse } = await import('../utils/notificationResponse.js')
const libDynamoDB = await import('@aws-sdk/lib-dynamodb')

describe('updateOrganization Lambda', () => {
  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterAll(() => {
    console.error.mockRestore()
  })

  const mockHeaders = { 'Content-Type': 'application/json' }
  const mockSend = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    libDynamoDB.DynamoDBDocumentClient.from.mockReturnValue({
      send: mockSend,
    })
  })

  it('should return 400 if id or name is missing', async () => {
    const event = { body: JSON.stringify({ id: 'org1' }) }
    const response = await updateOrganization(event, mockHeaders)
    const body = JSON.parse(response.body)

    expect(response.statusCode).toBe(400)
    expect(body.notification.error).toBe(true)
    expect(body.notification.message).toBe('Organization id and name are required')
  })

  it('should update organization and return 200 with updated attributes', async () => {
    const updatedAttrs = { id: 'org1', name: 'New Name', updated_at: '2025-07-25T00:00:00.000Z' }
    mockSend.mockResolvedValueOnce({ Attributes: updatedAttrs })

    const event = { body: JSON.stringify({ id: 'org1', name: 'New Name' }) }
    const response = await updateOrganization(event, mockHeaders)
    const body = JSON.parse(response.body)

    expect(response.statusCode).toBe(200)
    expect(body.notification.error).toBe(false)
    expect(body.notification.message).toBe('Organization updated successfully')
    expect(body.data).toEqual(updatedAttrs)
  })

  it('should return 404 if ConditionalCheckFailedException error occurs', async () => {
    const error = new Error('Conditional check failed')
    error.name = 'ConditionalCheckFailedException'
    mockSend.mockRejectedValueOnce(error)

    const event = { body: JSON.stringify({ id: 'org1', name: 'New Name' }) }
    const response = await updateOrganization(event, mockHeaders)
    const body = JSON.parse(response.body)

    expect(response.statusCode).toBe(404)
    expect(body.notification.error).toBe(true)
    expect(body.notification.message).toBe('Organization not found')
  })

  it('should return 500 on unexpected error', async () => {
    mockSend.mockRejectedValueOnce(new Error('Unexpected error'))

    const event = { body: JSON.stringify({ id: 'org1', name: 'New Name' }) }
    const response = await updateOrganization(event, mockHeaders)
    const body = JSON.parse(response.body)

    expect(response.statusCode).toBe(500)
    expect(body.notification.error).toBe(true)
    expect(body.notification.message).toBe('Internal Server Error')
  })
})
