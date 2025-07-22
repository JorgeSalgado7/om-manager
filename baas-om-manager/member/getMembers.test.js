import { listMembersWithOrganizations } from '../members/listMembersWithOrganizations'

import { DynamoDBDocumentClient, ScanCommand, QueryCommand, GetCommand } from '@aws-sdk/lib-dynamodb'

jest.mock('@aws-sdk/lib-dynamodb', () => {
  const originalModule = jest.requireActual('@aws-sdk/lib-dynamodb')
  return {
    ...originalModule,
    DynamoDBDocumentClient: {
      from: jest.fn(() => ({
        send: jest.fn()
      }))
    },
    ScanCommand: jest.fn(),
    QueryCommand: jest.fn(),
    GetCommand: jest.fn(),
  }
})

describe('listMembersWithOrganizations', () => {
  let sendMock

  beforeEach(() => {
    sendMock = jest.fn()
    DynamoDBDocumentClient.from.mockReturnValue({ send: sendMock })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('should return members with their organizations and roles', async () => {
    // Mock ScanCommand to return 2 members
    sendMock
      .mockResolvedValueOnce({
        Items: [
          { id: 'member1', email: 'user1@example.com', status: 'active' },
          { id: 'member2', email: 'user2@example.com', status: 'invited' },
        ]
      })
      // Mock QueryCommand for member1's orgs
      .mockResolvedValueOnce({
        Items: [
          { id: 'mo1', id_member: 'member1', id_organization: 'org1', role: 'owner' },
          { id: 'mo2', id_member: 'member1', id_organization: 'org2', role: 'member' },
        ]
      })
      // Mock GetCommand for org1
      .mockResolvedValueOnce({
        Item: { id: 'org1', name: 'Organization One' }
      })
      // Mock GetCommand for org2
      .mockResolvedValueOnce({
        Item: { id: 'org2', name: 'Organization Two' }
      })
      // Mock QueryCommand for member2's orgs (empty)
      .mockResolvedValueOnce({
        Items: []
      })

    const response = await listMembersWithOrganizations()

    expect(response.statusCode).toBe(200)

    const body = JSON.parse(response.body)
    expect(body).toHaveLength(2)

    expect(body[0]).toEqual({
      id: 'member1',
      email: 'user1@example.com',
      status: 'active',
      organizations: [
        { id: 'org1', name: 'Organization One', role: 'owner' },
        { id: 'org2', name: 'Organization Two', role: 'member' },
      ]
    })

    expect(body[1]).toEqual({
      id: 'member2',
      email: 'user2@example.com',
      status: 'invited',
      organizations: []
    })
  })

  test('should return 500 on error', async () => {
    sendMock.mockRejectedValue(new Error('Dynamo error'))

    const response = await listMembersWithOrganizations()

    expect(response.statusCode).toBe(500)
    expect(JSON.parse(response.body)).toEqual({ error: 'Internal Server Error' })
  })
})
