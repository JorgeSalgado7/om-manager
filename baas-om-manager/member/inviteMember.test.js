import { inviteMember } from '../member/inviteMember'
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb'
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'
import { notificationResponse } from '../utils/notificationResponse.js'

jest.mock('@aws-sdk/lib-dynamodb', () => {
  const originalModule = jest.requireActual('@aws-sdk/lib-dynamodb')
  return {
    ...originalModule,
    DynamoDBDocumentClient: {
      from: jest.fn(() => ({
        send: jest.fn()
      }))
    },
    PutCommand: jest.fn()
  }
})

jest.mock('@aws-sdk/client-ses', () => {
  const originalModule = jest.requireActual('@aws-sdk/client-ses')
  return {
    ...originalModule,
    SESClient: jest.fn(() => ({
      send: jest.fn()
    })),
    SendEmailCommand: jest.fn()
  }
})

describe('inviteMember', () => {
  let ddbSendMock
  let sesSendMock
  const fakeHeaders = { "Access-Control-Allow-Origin": "*" }

  beforeEach(() => {
    ddbSendMock = jest.fn()
    sesSendMock = jest.fn()

    DynamoDBDocumentClient.from.mockReturnValue({ send: ddbSendMock })
    SESClient.mockImplementation(() => ({ send: sesSendMock }))
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('returns 400 if required fields missing', async () => {
    const response = await inviteMember({ body: '{}' }, fakeHeaders)
    expect(response.statusCode).toBe(400)

    const body = JSON.parse(response.body)
    expect(body).toEqual(notificationResponse(null, true, "email, id_organization and invited_by are required"))
    expect(response.headers).toEqual(fakeHeaders)
  })

  test('invites member successfully', async () => {
    ddbSendMock.mockResolvedValue({})
    sesSendMock.mockResolvedValue({})

    const event = {
      body: JSON.stringify({
        email: 'test@example.com',
        id_organization: 'org123',
        invited_by: 'owner123'
      })
    }

    const response = await inviteMember(event, fakeHeaders)

    expect(ddbSendMock).toHaveBeenCalledTimes(1)
    expect(sesSendMock).toHaveBeenCalledTimes(1)
    expect(response.statusCode).toBe(201)

    const body = JSON.parse(response.body)
    // We expect memberItem in data and message "Invitation sent"
    expect(body.error).toBe(false)
    expect(body.message).toBe("Invitation sent")
    expect(body.data).toMatchObject({
      email: 'test@example.com',
      id_organization: 'org123',
      invited_by: 'owner123',
      status: 'invited'
    })
    expect(response.headers).toEqual(fakeHeaders)
  })

  test('returns 409 if member already exists', async () => {
    const error = new Error()
    error.name = 'ConditionalCheckFailedException'
    ddbSendMock.mockRejectedValue(error)

    const event = {
      body: JSON.stringify({
        email: 'test@example.com',
        id_organization: 'org123',
        invited_by: 'owner123'
      })
    }

    const response = await inviteMember(event, fakeHeaders)

    expect(response.statusCode).toBe(409)

    const body = JSON.parse(response.body)
    expect(body).toEqual(notificationResponse(null, true, "Member already invited or exists in this organization"))
    expect(response.headers).toEqual(fakeHeaders)
  })

  test('returns 500 on internal error', async () => {
    ddbSendMock.mockRejectedValue(new Error('DB error'))

    const event = {
      body: JSON.stringify({
        email: 'test@example.com',
        id_organization: 'org123',
        invited_by: 'owner123'
      })
    }

    const response = await inviteMember(event, fakeHeaders)

    expect(response.statusCode).toBe(500)

    const body = JSON.parse(response.body)
    expect(body).toEqual(notificationResponse(null, true, "Internal Server Error"))
    expect(response.headers).toEqual(fakeHeaders)
  })
})
