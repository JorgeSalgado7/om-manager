import { jest } from '@jest/globals'

// Mockeamos @aws-sdk/lib-dynamodb antes de importar el código
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

const updateMemberRoleModule = await import('./updateMemberRole.js')
const notificationResponseModule = await import('../utils/notificationResponse.js')
const libDynamoDB = await import('@aws-sdk/lib-dynamodb')

const updateMemberRole = updateMemberRoleModule.updateMemberRole
const notificationResponse = notificationResponseModule.notificationResponse

describe('updateMemberRole Lambda', () => {
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

  it('should return 400 if required fields are missing', async () => {
    const event = { body: JSON.stringify({}) }
    const response = await updateMemberRole(event, mockHeaders)
    const body = JSON.parse(response.body)

    expect(response.statusCode).toBe(400)
    expect(body.notification.error).toBe(true)
    expect(body.notification.message).toBe('id_member_org and role are required')
  })

  it('should update role and return 200', async () => {
    const updatedAttributes = { id: 'memberOrg123', role: 'admin' }
    mockSend.mockResolvedValueOnce({ Attributes: updatedAttributes })

    const event = {
      body: JSON.stringify({
        id_member_org: 'memberOrg123',
        role: 'admin',
      }),
    }

    const response = await updateMemberRole(event, mockHeaders)
    const body = JSON.parse(response.body)

    expect(mockSend).toHaveBeenCalledTimes(1)
    // Verificamos que se usó UpdateCommand con los parámetros correctos
    const calledWith = mockSend.mock.calls[0][0]
    expect(calledWith).toBeInstanceOf(libDynamoDB.UpdateCommand)
    expect(calledWith.input.Key.id).toBe('memberOrg123')
    expect(calledWith.input.UpdateExpression).toBe('set #r = :r')
    expect(calledWith.input.ExpressionAttributeValues[':r']).toBe('admin')

    expect(response.statusCode).toBe(200)
    expect(body.notification.error).toBe(false)
    expect(body.notification.message).toBe('Role updated')
    expect(body.data.updatedItem).toEqual(updatedAttributes)
  })

  it('should return 500 on unexpected error', async () => {
    mockSend.mockRejectedValueOnce(new Error('Unexpected error'))

    const event = {
      body: JSON.stringify({
        id_member_org: 'memberOrg123',
        role: 'admin',
      }),
    }

    const response = await updateMemberRole(event, mockHeaders)
    const body = JSON.parse(response.body)

    expect(response.statusCode).toBe(500)
    expect(body.notification.error).toBe(true)
    expect(body.notification.message).toBe('Internal Server Error')
  })
})
