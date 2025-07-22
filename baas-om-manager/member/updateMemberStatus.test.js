import { updateMemberStatus } from '../member/updateMemberStatus'

import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb'

jest.mock('@aws-sdk/lib-dynamodb', () => {
  const originalModule = jest.requireActual('@aws-sdk/lib-dynamodb')
  return {
    ...originalModule,
    DynamoDBDocumentClient: {
      from: jest.fn(() => ({
        send: jest.fn(),
      })),
    },
    UpdateCommand: jest.fn(),
  }
})

describe('updateMemberStatus lambda', () => {

  let sendMock

  beforeAll(() => {
    sendMock = jest.fn()
    DynamoDBDocumentClient.from.mockReturnValue({ send: sendMock })
  })

  beforeEach(() => {
    sendMock.mockReset()
  })

  it('returns 400 if id or status missing', async () => {
    const event = { body: JSON.stringify({ id: '123' }) }
    const response = await updateMemberStatus(event)
    expect(response.statusCode).toBe(400)
    expect(JSON.parse(response.body).error).toBe('id and status are required')

    const event2 = { body: JSON.stringify({ status: 'active' }) }
    const response2 = await updateMemberStatus(event2)
    expect(response2.statusCode).toBe(400)
  })

  it('returns 400 if status invalid', async () => {
    const event = { body: JSON.stringify({ id: '123', status: 'invalid' }) }
    const response = await updateMemberStatus(event)
    expect(response.statusCode).toBe(400)
    expect(JSON.parse(response.body).error).toMatch(/Invalid status/)
  })

  it('updates status successfully', async () => {
    const event = { body: JSON.stringify({ id: '123', status: 'active' }) }

    const updatedItem = {
      id: '123',
      status: 'active',
      updated_at: new Date().toISOString(),
    }

    sendMock.mockResolvedValue({ Attributes: updatedItem })

    const response = await updateMemberStatus(event)

    expect(sendMock).toHaveBeenCalled()
    expect(response.statusCode).toBe(200)

    const body = JSON.parse(response.body)
    expect(body.message).toBe('Status updated')
    expect(body.updatedMember).toEqual(updatedItem)
  })

  it('returns 404 if record not found', async () => {
    const event = { body: JSON.stringify({ id: '123', status: 'active' }) }

    const error = new Error()
    error.name = 'ConditionalCheckFailedException'
    sendMock.mockRejectedValue(error)

    const response = await updateMemberStatus(event)

    expect(response.statusCode).toBe(404)
    expect(JSON.parse(response.body).error).toBe('Member organization record not found')
  })

  it('returns 500 on other errors', async () => {
    const event = { body: JSON.stringify({ id: '123', status: 'active' }) }

    sendMock.mockRejectedValue(new Error('Some error'))

    const response = await updateMemberStatus(event)

    expect(response.statusCode).toBe(500)
    expect(JSON.parse(response.body).error).toBe('Internal Server Error')
  })

})
