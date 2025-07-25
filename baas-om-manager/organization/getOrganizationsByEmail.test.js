import { jest } from '@jest/globals'

jest.unstable_mockModule('@aws-sdk/lib-dynamodb', () => {
  const actual = jest.requireActual('@aws-sdk/lib-dynamodb')
  return {
    ...actual,
    DynamoDBDocumentClient: {
      from: jest.fn(),
    },
    ScanCommand: actual.ScanCommand || class ScanCommand {},
    QueryCommand: actual.QueryCommand || class QueryCommand {},
    BatchGetCommand: actual.BatchGetCommand || class BatchGetCommand {},
  }
})

const { getOrganizationsByEmail } = await import('./getOrganizationsByEmail.js')
const { notificationResponse } = await import('../utils/notificationResponse.js')
const libDynamoDB = await import('@aws-sdk/lib-dynamodb')

describe('getOrganizationsByEmail Lambda', () => {
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

  it('should return 400 if email is missing', async () => {
    const event = { body: JSON.stringify({}) }
    const response = await getOrganizationsByEmail(event, mockHeaders)
    const body = JSON.parse(response.body)

    expect(response.statusCode).toBe(400)
    expect(body.notification.error).toBe(true)
    expect(body.notification.message).toBe('Email is required')
  })

  it('should return 404 if member not found', async () => {
    mockSend.mockResolvedValueOnce({ Items: [] }) // ScanCommand: member search

    const event = { body: JSON.stringify({ email: 'notfound@example.com' }) }
    const response = await getOrganizationsByEmail(event, mockHeaders)
    const body = JSON.parse(response.body)

    expect(response.statusCode).toBe(404)
    expect(body.notification.error).toBe(true)
    expect(body.notification.message).toBe('Member not found')
  })

  it('should return 404 if no organizations found', async () => {
    mockSend
      .mockResolvedValueOnce({ Items: [{ id: 'member1' }] }) // ScanCommand: member found
      .mockResolvedValueOnce({ Items: [], LastEvaluatedKey: undefined }) // QueryCommand: no orgs found

    const event = { body: JSON.stringify({ email: 'member@example.com' }) }
    const response = await getOrganizationsByEmail(event, mockHeaders)
    const body = JSON.parse(response.body)

    expect(response.statusCode).toBe(404)
    expect(body.notification.error).toBe(true)
    expect(body.notification.message).toBe('No organizations found for member')
  })

  it('should return organizations with roles for member', async () => {
    const memberId = 'member1'
    const memberOrgItems = [
      { id: 'mo1', id_organization: 'org1', role: 'admin' },
      { id: 'mo2', id_organization: 'org2', role: 'member' },
    ]
    const organizations = [
      { id: 'org1', name: 'Org One' },
      { id: 'org2', name: 'Org Two' },
    ]

    mockSend
      .mockResolvedValueOnce({ Items: [{ id: memberId }] }) // ScanCommand: member found
      .mockResolvedValueOnce({ Items: memberOrgItems, LastEvaluatedKey: undefined }) // QueryCommand: org memberships
      .mockResolvedValueOnce({ Responses: { [process.env.ORGANIZATION_TABLE]: organizations } }) // BatchGetCommand: org details

    const event = { body: JSON.stringify({ email: 'member@example.com' }) }
    const response = await getOrganizationsByEmail(event, mockHeaders)
    const body = JSON.parse(response.body)

    expect(response.statusCode).toBe(200)
    expect(body.notification.error).toBe(false)
    expect(body.notification.message).toBe(`Found ${organizations.length} organizations for member`)
    expect(body.data).toEqual([
      { id: 'org1', name: 'Org One', role: 'admin' },
      { id: 'org2', name: 'Org Two', role: 'member' },
    ])
  })

  it('should return 500 on unexpected error', async () => {
    mockSend.mockRejectedValueOnce(new Error('Unexpected error'))

    const event = { body: JSON.stringify({ email: 'error@example.com' }) }
    const response = await getOrganizationsByEmail(event, mockHeaders)
    const body = JSON.parse(response.body)

    expect(response.statusCode).toBe(500)
    expect(body.notification.error).toBe(true)
    expect(body.notification.message).toBe('Internal Server Error')
  })
})
