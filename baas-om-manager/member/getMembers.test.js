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
    GetCommand: actual.GetCommand || class GetCommand {},
  }
})

const { getMembers } = await import('./getMembers.js')
const { notificationResponse } = await import('../utils/notificationResponse.js')
const libDynamoDB = await import('@aws-sdk/lib-dynamodb')

describe('getMembers Lambda', () => {

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

  it('should return 200 and list members with organizations and roles', async () => {
    // Mock respuesta para ScanCommand (lista miembros)
    mockSend.mockImplementationOnce(() => Promise.resolve({
      Items: [
        { id: 'm1', email: 'member1@example.com', status: 'active' },
        { id: 'm2', email: 'member2@example.com', status: 'inactive' },
      ]
    }))

    // Mock respuesta para QueryCommand (relaciones miembro-org)
    mockSend.mockImplementationOnce(() => Promise.resolve({
      Items: [
        { id: 'mo1', id_organization: 'org1', role: 'admin' },
        { id: 'mo2', id_organization: 'org2', role: 'member' },
      ]
    }))

    // Segundo llamado QueryCommand para el segundo miembro (vacío)
    mockSend.mockImplementationOnce(() => Promise.resolve({
      Items: []
    }))

    // Mock respuesta para GetCommand (datos org 1)
    mockSend.mockImplementationOnce(() => Promise.resolve({
      Item: { id: 'org1', name: 'Organization 1' }
    }))

    // Mock respuesta para GetCommand (datos org 2)
    mockSend.mockImplementationOnce(() => Promise.resolve({
      Item: { id: 'org2', name: 'Organization 2' }
    }))

    const event = { body: null } // event no se usa realmente para este lambda
    const response = await getMembers(event, mockHeaders)
    const body = JSON.parse(response.body)

    expect(response.statusCode).toBe(200)
    expect(body.notification.error).toBe(false)
    expect(Array.isArray(body.data)).toBe(true)

    expect(body.data.length).toBe(2)

    expect(body.data[0]).toEqual({
      id: 'm1',
      email: 'member1@example.com',
      status: 'active',
      organizations: [
        { id_member_role: 'mo1', id: 'org1', name: 'Organization 1', role: 'admin' },
        { id_member_role: 'mo2', id: 'org2', name: 'Organization 2', role: 'member' },
      ]
    })

    expect(body.data[1]).toEqual({
      id: 'm2',
      email: 'member2@example.com',
      status: 'inactive',
      organizations: []
    })
  })

  it('should return 200 and empty array if no members', async () => {
    mockSend.mockResolvedValueOnce({ Items: [] })

    const event = { body: null }
    const response = await getMembers(event, mockHeaders)
    const body = JSON.parse(response.body)

    expect(response.statusCode).toBe(200)
    expect(body.notification.error).toBe(false)
    expect(body.data).toEqual([])
  })

  it('should return 500 on unexpected error', async () => {
    mockSend.mockRejectedValueOnce(new Error('Unexpected failure'))

    const event = { body: null }
    const response = await getMembers(event, mockHeaders)
    const body = JSON.parse(response.body)

    expect(response.statusCode).toBe(500)
    expect(body.notification.error).toBe(true)
    expect(body.notification.message).toBe('Internal Server Error')
  })
})
