import { jest } from '@jest/globals'

jest.unstable_mockModule('@aws-sdk/lib-dynamodb', () => {
  const actual = jest.requireActual('@aws-sdk/lib-dynamodb')
  return {
    ...actual,
    DynamoDBDocumentClient: {
      from: jest.fn(),
    },
    ScanCommand: actual.ScanCommand || class ScanCommand {},
  }
})

const { getAll } = await import('./getAll.js')
const { notificationResponse } = await import('../utils/notificationResponse.js')
const libDynamoDB = await import('@aws-sdk/lib-dynamodb')

describe('getAll Lambda', () => {
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

  it('should return 200 and organizations list', async () => {
    const mockOrgs = [
      { id: 'org1', name: 'Organization 1' },
      { id: 'org2', name: 'Organization 2' },
    ]

    mockSend.mockResolvedValueOnce({ Items: mockOrgs })

    const event = { }
    const response = await getAll(event, mockHeaders)
    const body = JSON.parse(response.body)

    expect(response.statusCode).toBe(200)
    expect(body.notification.error).toBe(false)
    expect(body.data).toEqual(mockOrgs)
  })

  it('should handle error and return 500', async () => {
    mockSend.mockRejectedValueOnce(new Error('Some failure'))

    const event = { }
    const response = await getAll(event, mockHeaders)
    const body = JSON.parse(response.body)

    expect(response.statusCode).toBe(500)
    expect(body.notification.error).toBe(true)
    expect(body.notification.message).toBe('Internal Server Error')
  })
})
