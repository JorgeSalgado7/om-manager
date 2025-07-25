import { jest } from '@jest/globals'

// Mockeamos el módulo antes de importar el código que lo usa
jest.unstable_mockModule('@aws-sdk/lib-dynamodb', () => {
  return {
    DynamoDBDocumentClient: {
      from: jest.fn(),
    },
    DeleteCommand: class DeleteCommand {}, // clase vacía para que exista
  }
})

// Importamos dinámicamente después de mockear
const { deleteMemberFromOrganization } = await import('./deleteMemberFromOrg.js')
const { notificationResponse } = await import('../utils/notificationResponse.js')
const libDynamoDB = await import('@aws-sdk/lib-dynamodb')

describe('deleteMemberFromOrganization Lambda', () => {

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
    // Mockeamos que DynamoDBDocumentClient.from() devuelve un objeto con método send mockeado
    libDynamoDB.DynamoDBDocumentClient.from.mockReturnValue({
      send: mockSend,
    })
  })

  it('should return 400 if id_member_org is missing', async () => {
    const event = { body: JSON.stringify({}) }
    const response = await deleteMemberFromOrganization(event, mockHeaders)
    const body = JSON.parse(response.body)

    expect(response.statusCode).toBe(400)
    expect(body.notification.error).toBe(true)
    expect(body.notification.message).toBe('id_member_org is required')
  })

  it('should return 200 and delete member', async () => {
    mockSend.mockResolvedValueOnce({})

    const event = { body: JSON.stringify({ id_member_org: '123' }) }
    const response = await deleteMemberFromOrganization(event, mockHeaders)
    const body = JSON.parse(response.body)

    expect(mockSend).toHaveBeenCalledTimes(1)
    expect(response.statusCode).toBe(200)
    expect(body.notification.error).toBe(false)
    expect(body.data.id).toBe('123')
    expect(body.notification.message).toBe('Member removed from organization')
  })

  it('should return 404 if member not found', async () => {
    const error = new Error('Conditional check failed')
    error.name = 'ConditionalCheckFailedException'
    mockSend.mockRejectedValueOnce(error)

    const event = { body: JSON.stringify({ id_member_org: 'notfound' }) }
    const response = await deleteMemberFromOrganization(event, mockHeaders)
    const body = JSON.parse(response.body)

    expect(response.statusCode).toBe(404)
    expect(body.notification.error).toBe(true)
    expect(body.notification.message).toBe('Member not found in organization')
  })

  it('should return 500 on unexpected error', async () => {
    mockSend.mockRejectedValueOnce(new Error('Unexpected failure'))

    const event = { body: JSON.stringify({ id_member_org: 'error' }) }
    const response = await deleteMemberFromOrganization(event, mockHeaders)
    const body = JSON.parse(response.body)

    expect(response.statusCode).toBe(500)
    expect(body.notification.error).toBe(true)
    expect(body.notification.message).toBe('Internal Server Error')
  })
})
