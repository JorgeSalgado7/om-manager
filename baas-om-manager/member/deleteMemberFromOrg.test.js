import { deleteMemberFromOrganization } from '../member/deleteMemberFromOrganization'
import { DynamoDBDocumentClient, DeleteCommand } from '@aws-sdk/lib-dynamodb'

jest.mock('@aws-sdk/lib-dynamodb', () => {
  const originalModule = jest.requireActual('@aws-sdk/lib-dynamodb')
  return {
    ...originalModule,
    DynamoDBDocumentClient: {
      from: jest.fn(() => ({
        send: jest.fn()
      }))
    },
    DeleteCommand: jest.fn()
  }
})

describe('deleteMemberFromOrganization', () => {
  let sendMock
  const fakeHeaders = { "Access-Control-Allow-Origin": "*" }

  beforeEach(() => {
    sendMock = jest.fn()
    DynamoDBDocumentClient.from.mockReturnValue({ send: sendMock })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('returns 400 if id_member_org is missing', async () => {
    const response = await deleteMemberFromOrganization({ body: '{}' }, fakeHeaders)
    expect(response.statusCode).toBe(400)
    const body = JSON.parse(response.body)
    expect(body.error).toBe('id_member_org is required')
  })

  test('deletes member from organization successfully', async () => {
    sendMock.mockResolvedValue({})

    const event = {
      body: JSON.stringify({ id_member_org: 'memberOrgId123' })
    }

    const response = await deleteMemberFromOrganization(event, fakeHeaders)
    expect(sendMock).toHaveBeenCalledTimes(1)
    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.message).toBe('Member removed from organization')
    expect(body.id).toBe('memberOrgId123')
  })

  test('returns 404 if member not found', async () => {
    const error = new Error()
    error.name = 'ConditionalCheckFailedException'
    sendMock.mockRejectedValue(error)

    const event = {
      body: JSON.stringify({ id_member_org: 'nonexistentId' })
    }

    const response = await deleteMemberFromOrganization(event, fakeHeaders)
    expect(response.statusCode).toBe(404)
    const body = JSON.parse(response.body)
    expect(body.error).toBe('Member not found in organization')
  })

  test('returns 500 on internal error', async () => {
    sendMock.mockRejectedValue(new Error('Some DB error'))

    const event = {
      body: JSON.stringify({ id_member_org: 'memberOrgId123' })
    }

    const response = await deleteMemberFromOrganization(event, fakeHeaders)
    expect(response.statusCode).toBe(500)
    const body = JSON.parse(response.body)
    expect(body.error).toBe('Internal Server Error')
  })
})
