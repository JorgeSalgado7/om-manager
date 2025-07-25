import { jest } from '@jest/globals'

// Mockeamos módulos antes de importar el código
jest.unstable_mockModule('@aws-sdk/lib-dynamodb', () => {
  const actual = jest.requireActual('@aws-sdk/lib-dynamodb')
  return {
    ...actual,
    DynamoDBDocumentClient: {
      from: jest.fn(),
    },
    ScanCommand: actual.ScanCommand || class ScanCommand {},
    PutCommand: actual.PutCommand || class PutCommand {},
  }
})

jest.unstable_mockModule('nodemailer', () => {
  return {
    createTransport: jest.fn(() => ({
      sendMail: jest.fn(),
    })),
  }
})

// Importamos módulos ya con mocks aplicados
const inviteMemberModule = await import('./inviteMember.js')
const notificationResponseModule = await import('../utils/notificationResponse.js')
const libDynamoDB = await import('@aws-sdk/lib-dynamodb')

const inviteMember = inviteMemberModule.inviteMember
const notificationResponse = notificationResponseModule.notificationResponse

describe('inviteMember Lambda', () => {
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
  const mockSendMail = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    libDynamoDB.DynamoDBDocumentClient.from.mockReturnValue({
      send: mockSend,
    })
    // Obtenemos el mock de nodemailer y configuramos su comportamiento
    const nodemailerMock = jest.requireMock('nodemailer')
    nodemailerMock.createTransport.mockReturnValue({
      sendMail: mockSendMail,
    })
  })

  it('should return 400 if required fields are missing', async () => {
    const event = { body: JSON.stringify({}) }
    const response = await inviteMember(event, mockHeaders)
    const body = JSON.parse(response.body)

    expect(response.statusCode).toBe(400)
    expect(body.notification.error).toBe(true)
    expect(body.notification.message).toBe('email, id_organization and invited_by are required')
  })

  it('should send invitation to new member and return 201', async () => {
    // Simulamos que no encontró miembro previo
    mockSend.mockImplementationOnce(() => Promise.resolve({ Items: [] }))  // ScanCommand (buscar email)
    mockSend.mockImplementationOnce(() => Promise.resolve())              // PutCommand (insertar nuevo miembro)
    mockSend.mockImplementationOnce(() => Promise.resolve())              // PutCommand (insertar relación miembro-org)

    mockSendMail.mockResolvedValueOnce({})

    const body = {
      email: 'newmember@example.com',
      id_organization: 'org123',
      invited_by: 'inviter123',
    }
    const event = { body: JSON.stringify(body) }
    const response = await inviteMember(event, mockHeaders)
    const resBody = JSON.parse(response.body)

    expect(response.statusCode).toBe(201)
    expect(resBody.notification.error).toBe(false)
    expect(resBody.notification.message).toBe('Invitation sent to new member')
    expect(resBody.data.id).toBeDefined()

    expect(mockSend).toHaveBeenCalledTimes(3)
    expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
      to: body.email,
      subject: expect.stringContaining('Invitación'),
    }))
  })

  it('should send invitation to existing member and return 201', async () => {
    // Simulamos que encontró miembro existente
    mockSend.mockImplementationOnce(() => Promise.resolve({
      Items: [{ id: 'existing-id' }]
    }))  // ScanCommand (buscar email)

    mockSend.mockImplementationOnce(() => Promise.resolve())  // PutCommand (insertar relación miembro-org)
    mockSendMail.mockResolvedValueOnce({})

    const body = {
      email: 'existingmember@example.com',
      id_organization: 'org123',
      invited_by: 'inviter123',
    }
    const event = { body: JSON.stringify(body) }
    const response = await inviteMember(event, mockHeaders)
    const resBody = JSON.parse(response.body)

    expect(response.statusCode).toBe(201)
    expect(resBody.notification.error).toBe(false)
    expect(resBody.notification.message).toBe('Invitation sent to existing member')
    expect(resBody.data.id).toBe('existing-id')

    expect(mockSend).toHaveBeenCalledTimes(2)
    expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
      to: body.email,
      subject: expect.stringContaining('Invitación'),
    }))
  })

  it('should return 409 if ConditionalCheckFailedException occurs', async () => {
    mockSend.mockImplementationOnce(() => Promise.resolve({ Items: [] }))  // ScanCommand (buscar email)
    mockSend.mockImplementationOnce(() => {
      const err = new Error('Conditional check failed')
      err.name = 'ConditionalCheckFailedException'
      return Promise.reject(err)
    })

    const body = {
      email: 'conflict@example.com',
      id_organization: 'org123',
      invited_by: 'inviter123',
    }
    const event = { body: JSON.stringify(body) }
    const response = await inviteMember(event, mockHeaders)
    const resBody = JSON.parse(response.body)

    expect(response.statusCode).toBe(409)
    expect(resBody.notification.error).toBe(true)
    expect(resBody.notification.message).toBe('Member already added to this organization')
  })

  it('should return 500 on unexpected error', async () => {
    mockSend.mockRejectedValueOnce(new Error('Unexpected failure'))

    const body = {
      email: 'fail@example.com',
      id_organization: 'org123',
      invited_by: 'inviter123',
    }
    const event = { body: JSON.stringify(body) }
    const response = await inviteMember(event, mockHeaders)
    const resBody = JSON.parse(response.body)

    expect(response.statusCode).toBe(500)
    expect(resBody.notification.error).toBe(true)
    expect(resBody.notification.message).toBe('Internal Server Error')
  })
})
