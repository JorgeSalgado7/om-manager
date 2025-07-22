import { getMemberOrganizations } from '../member/getMemberOrganizations'

import { DynamoDBDocumentClient, QueryCommand, BatchGetCommand } from '@aws-sdk/lib-dynamodb'

jest.mock('@aws-sdk/lib-dynamodb', () => {
  const originalModule = jest.requireActual('@aws-sdk/lib-dynamodb')
  return {
    ...originalModule,
    DynamoDBDocumentClient: {
      from: jest.fn(() => ({
        send: jest.fn(),
      })),
    },
    QueryCommand: jest.fn(),
    BatchGetCommand: jest.fn(),
  }
})

describe('getMemberOrganizations lambda', () => {

  let sendMock

  beforeAll(() => {
    sendMock = jest.fn()
    DynamoDBDocumentClient.from.mockReturnValue({ send: sendMock })
  })

  beforeEach(() => {
    sendMock.mockReset()
  })

  it('returns 400 if id_member missing', async () => {
    const event = { queryStringParameters: {} }
    const response = await getMemberOrganizations(event)
    expect(response.statusCode).toBe(400)
    expect(JSON.parse(response.body).error).toBe('id_member is required')
  })

  it('returns empty array if no organizations', async () => {
    const event = { queryStringParameters: { id_member: 'user123' } }

    sendMock.mockImplementationOnce(() => Promise.resolve({ Items: [] }))

    const response = await getMemberOrganizations(event)

    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body).organizations).toEqual([])
  })

  it('returns organizations with roles', async () => {
    const event = { queryStringParameters: { id_member: 'user123' } }

    const memberOrgItems = [
      { id: 'mo1', id_member: 'user123', id_organization: 'org1', role: 'owner' },
      { id: 'mo2', id_member: 'user123', id_organization: 'org2', role: 'member' },
    ]

    const orgItems = [
      { id: 'org1', name: 'Org One' },
      { id: 'org2', name: 'Org Two' },
    ]

    sendMock
      .mockImplementationOnce(() => Promise.resolve({ Items: memberOrgItems }))
      .mockImplementationOnce(() => Promise.resolve({ Responses: { 'om-organization': orgItems } }))

    const response = await getMemberOrganizations(event)

    expect(response.statusCode).toBe(200)

    const body = JSON.parse(response.body)

    expect(body.organizations).toEqual([
      { id: 'org1', name: 'Org One', role: 'owner' },
      { id: 'org2', name: 'Org Two', role: 'member' },
    ])
  })

  it('handles error and returns 500', async () => {
    const event = { queryStringParameters: { id_member: 'user123' } }

    sendMock.mockRejectedValue(new Error('Fail'))

    const response = await getMemberOrganizations(event)

    expect(response.statusCode).toBe(500)
    expect(JSON.parse(response.body).error).toBe('Internal Server Error')
  })

})
