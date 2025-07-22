import { updateMemberRole } from '../member/updateMemberRole'
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb'

jest.mock('@aws-sdk/lib-dynamodb', () => {
  const originalModule = jest.requireActual('@aws-sdk/lib-dynamodb')
  return {
    ...originalModule,
    DynamoDBDocumentClient: {
      from: jest.fn(() => ({
        send: jest.fn()
      }))
    },
    UpdateCommand: jest.fn()
  }
})

describe('updateMemberRole', () => {
  let sendMock

  beforeEach(() => {
    sendMock = jest.fn()
    DynamoDBDocumentClient.from.mockReturnValue({ send: sendMock })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('returns 400 if id_member_org or role is missing', async () => {
    let response = await updateMemberRole({ body: '{}' })
    expect(response.statusCode).toBe(400)
    expect(JSON.parse(response.body).error).toBe('id_member_org and role are required')

    response = await updateMemberRole({ body: JSON.stringify({ id_member_org: 'id123' }) })
    expect(response.statusCode).toBe(400)
    expect(JSON.parse(response.body).error).toBe('id_member_org and role are required')

    response = await updateMemberRole({ body: JSON.stringify({ role: 'admin' }) })
    expect(response.statusCode).toBe(400)
    expect(JSON.parse(response.body).error).toBe('id_member_org and role are required')
  })

  test('updates role successfully', async () => {
    const mockAttributes = {
      id: 'id123',
      role: 'admin'
    }

    sendMock.mockResolvedValue({ Attributes: mockAttributes })

    const event = {
      body: JSON.stringify({
        id_member_org: 'id123',
        role: 'admin'
      })
    }

    const response = await updateMemberRole(event)
    expect(sendMock).toHaveBeenCalledTimes(1)

    expect(response.statusCode).toBe(200)

    const body = JSON.parse(response.body)
    expect(body.message).toBe('Role updated')
    expect(body.updatedItem).toEqual(mockAttributes)
  })

  test('returns 500 on internal error', async () => {
    sendMock.mockRejectedValue(new Error('DB error'))

    const event = {
      body: JSON.stringify({
        id_member_org: 'id123',
        role: 'admin'
      })
    }

    const response = await updateMemberRole(event)
    expect(response.statusCode).toBe(500)
    expect(JSON.parse(response.body).error).toBe('Internal Server Error')
  })
})
