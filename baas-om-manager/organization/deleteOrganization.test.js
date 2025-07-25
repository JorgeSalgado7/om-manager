import { jest } from '@jest/globals'

jest.unstable_mockModule('@aws-sdk/lib-dynamodb', () => {
  const actual = jest.requireActual('@aws-sdk/lib-dynamodb')
  return {
    ...actual,
    DynamoDBDocumentClient: {
      from: jest.fn(),
    },
    DeleteCommand: actual.DeleteCommand || class DeleteCommand {},
    QueryCommand: actual.QueryCommand || class QueryCommand {},
    BatchWriteCommand: actual.BatchWriteCommand || class BatchWriteCommand {},
  }
})

const { deleteOrganization } = await import('./deleteOrganization.js')
const { notificationResponse } = await import('../utils/notificationResponse.js')
const libDynamoDB = await import('@aws-sdk/lib-dynamodb')

describe('deleteOrganization Lambda', () => {
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

  it('should return 400 if id is missing', async () => {
    const event = { body: '{}' }
    const response = await deleteOrganization(event, mockHeaders)
    const body = JSON.parse(response.body)

    expect(response.statusCode).toBe(400)
    expect(body.notification.error).toBe(true)
    expect(body.notification.message).toBe('Organization id is required')
  })

  it('should delete organization and related member-org records, returning 200', async () => {
    const orgId = 'org-1234'

    // Mock DeleteCommand success (delete organization)
    mockSend.mockImplementationOnce(() => Promise.resolve({}))

    // Mock QueryCommand calls to simulate 2 pages of member-org items
    mockSend.mockImplementationOnce(() => Promise.resolve({
      Items: [
        { id: 'mo1' },
        { id: 'mo2' }
      ],
      LastEvaluatedKey: 'key1'
    }))
    mockSend.mockImplementationOnce(() => Promise.resolve({
      Items: [
        { id: 'mo3' }
      ],
      LastEvaluatedKey: undefined
    }))

    // Mock BatchWriteCommand call for deleting member-org relations (only one batch for 3 items)
    mockSend.mockImplementationOnce(() => Promise.resolve({}))

    const event = { body: JSON.stringify({ id: orgId }) }
    const response = await deleteOrganization(event, mockHeaders)
    const body = JSON.parse(response.body)

    expect(response.statusCode).toBe(200)
    expect(body.notification.error).toBe(false)
    expect(body.notification.message).toBe('Organization and related members deleted')
    expect(body.data.deletedId).toBe(orgId)

    // Delete organization + 2 query calls + 1 batch delete = 4 calls total
    expect(mockSend).toHaveBeenCalledTimes(4)
  })

  it('should return 404 if ConditionalCheckFailedException error occurs on delete', async () => {
    const error = new Error('Conditional check failed')
    error.name = 'ConditionalCheckFailedException'

    mockSend.mockRejectedValueOnce(error)

    const event = { body: JSON.stringify({ id: 'nonexistent-org' }) }
    const response = await deleteOrganization(event, mockHeaders)
    const body = JSON.parse(response.body)

    expect(response.statusCode).toBe(404)
    expect(body.notification.error).toBe(true)
    expect(body.notification.message).toBe('Organization not found')
  })

  it('should return 500 on unexpected error', async () => {
    mockSend.mockRejectedValueOnce(new Error('Unexpected error'))

    const event = { body: JSON.stringify({ id: 'org-error' }) }
    const response = await deleteOrganization(event, mockHeaders)
    const body = JSON.parse(response.body)

    expect(response.statusCode).toBe(500)
    expect(body.notification.error).toBe(true)
    expect(body.notification.message).toBe('Internal Server Error')
  })
})
