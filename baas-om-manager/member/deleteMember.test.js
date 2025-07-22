import { deleteMember } from '../member/deleteMember'
import { DynamoDBDocumentClient, DeleteCommand, QueryCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb'

jest.mock('@aws-sdk/lib-dynamodb', () => {
  const originalModule = jest.requireActual('@aws-sdk/lib-dynamodb')
  return {
    ...originalModule,
    DynamoDBDocumentClient: {
      from: jest.fn(() => ({
        send: jest.fn()
      }))
    },
    DeleteCommand: jest.fn(),
    QueryCommand: jest.fn(),
    BatchWriteCommand: jest.fn(),
  }
})

describe('deleteMember', () => {
  let sendMock

  beforeEach(() => {
    sendMock = jest.fn()
    DynamoDBDocumentClient.from.mockReturnValue({ send: sendMock })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('returns 400 if id_member is missing', async () => {
    const response = await deleteMember({ body: '{}' })
    expect(response.statusCode).toBe(400)
    expect(JSON.parse(response.body).error).toBe('id_member is required')
  })

  test('deletes member and related member-org relations successfully', async () => {
    // Primero delete member
    sendMock.mockResolvedValueOnce({})

    // Luego query member-org por id_member
    sendMock.mockResolvedValueOnce({
      Items: [
        { id: 'rel1', id_member: 'm1', id_organization: 'o1', role: 'owner' },
        { id: 'rel2', id_member: 'm1', id_organization: 'o2', role: 'member' },
      ],
      LastEvaluatedKey: undefined,
    })

    // Luego batch write para eliminar relaciones
    sendMock.mockResolvedValueOnce({})

    const event = {
      body: JSON.stringify({ id_member: 'm1' })
    }

    const response = await deleteMember(event)

    expect(sendMock).toHaveBeenCalledTimes(3)

    // La primera llamada debe ser DeleteCommand para borrar el member
    expect(sendMock.mock.calls[0][0].constructor.name).toBe('DeleteCommand')

    // La segunda llamada debe ser QueryCommand para obtener las relaciones
    expect(sendMock.mock.calls[1][0].constructor.name).toBe('QueryCommand')

    // La tercera llamada debe ser BatchWriteCommand para borrar las relaciones
    expect(sendMock.mock.calls[2][0].constructor.name).toBe('BatchWriteCommand')

    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body).message).toBe('Member and related organization relations deleted')
  })

  test('returns 404 if member not found', async () => {
    const error = new Error()
    error.name = 'ConditionalCheckFailedException'
    sendMock.mockRejectedValueOnce(error)

    const event = {
      body: JSON.stringify({ id_member: 'm1' })
    }

    const response = await deleteMember(event)

    expect(response.statusCode).toBe(404)
    expect(JSON.parse(response.body).error).toBe('Member not found')
  })

  test('returns 500 on internal error', async () => {
    sendMock.mockRejectedValue(new Error('DB error'))

    const event = {
      body: JSON.stringify({ id_member: 'm1' })
    }

    const response = await deleteMember(event)

    expect(response.statusCode).toBe(500)
    expect(JSON.parse(response.body).error).toBe('Internal Server Error')
  })

})
