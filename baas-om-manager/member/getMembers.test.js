import { getMembers } from '../members/getMembers'  // Ajusta la ruta si es necesario
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
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
  }
})

describe('getMembers', () => {
  let sendMock
  const fakeHeaders = { "Access-Control-Allow-Origin": "*" }

  beforeEach(() => {
    sendMock = jest.fn()
    DynamoDBDocumentClient.from.mockReturnValue({ send: sendMock })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('should return members with their organizations and roles including id_member_role', async () => {
    sendMock
      // ScanCommand: devuelve dos miembros
      .mockResolvedValueOnce({
        Items: [
          { id: 'member1', email: 'user1@example.com', status: 'active' },
          { id: 'member2', email: 'user2@example.com', status: 'invited' },
        ]
      })
      // QueryCommand para member1
      .mockResolvedValueOnce({
        Items: [
          { id: 'mo1', id_member: 'member1', id_organization: 'org1', role: 'owner' },
          { id: 'mo2', id_member: 'member1', id_organization: 'org2', role: 'member' },
        ]
      })
      // GetCommand para org1
      .mockResolvedValueOnce({
        Item: { id: 'org1', name: 'Organization One' }
      })
      // GetCommand para org2
      .mockResolvedValueOnce({
        Item: { id: 'org2', name: 'Organization Two' }
      })
      // QueryCommand para member2 (sin organizaciones)
      .mockResolvedValueOnce({
        Items: []
      })

    const response = await getMembers({}, fakeHeaders)

    expect(response.statusCode).toBe(200)

    const body = JSON.parse(response.body)
    expect(body).toEqual(
      notificationResponse(
        [
          {
            id: 'member1',
            email: 'user1@example.com',
            status: 'active',
            organizations: [
              { id_member_role: 'mo1', id: 'org1', name: 'Organization One', role: 'owner' },
              { id_member_role: 'mo2', id: 'org2', name: 'Organization Two', role: 'member' },
            ],
          },
          {
            id: 'member2',
            email: 'user2@example.com',
            status: 'invited',
            organizations: [],
          },
        ],
        false,
        null
      )
    )
  })

  test('should return 500 on error', async () => {
    sendMock.mockRejectedValue(new Error('Dynamo error'))

    const response = await getMembers({}, fakeHeaders)

    expect(response.statusCode).toBe(500)
    expect(JSON.parse(response.body)).toEqual(
      notificationResponse(null, true, "Internal Server Error")
    )
  })
})
