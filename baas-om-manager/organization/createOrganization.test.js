import { createOrganization } from "../organization/createOrganization"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, ScanCommand, PutCommand } from "@aws-sdk/lib-dynamodb"
import { mockClient } from "aws-sdk-client-mock"
import "aws-sdk-client-mock-jest"

const ddbMock = mockClient(DynamoDBClient)

const mockHeaders = {
  "Content-Type": "application/json"
}

describe("createOrganization Lambda", () => {

  beforeEach(() => {
    ddbMock.reset()
  })

  test("should create organization and member organization relation", async () => {
    
    ddbMock.on(ScanCommand).resolves({
      Items: [{ id: "member-123" }],
    })

    ddbMock.on(PutCommand).resolves({})

    const event = {
      body: JSON.stringify({
        name: "Org Test",
        email: "test@example.com",
      }),
    }

    const result = await createOrganization(event, mockHeaders)

    expect(result.statusCode).toBe(201)

    const body = JSON.parse(result.body)

    expect(body.notification.error).toBe(false)
    expect(body.data.name).toBe("Org Test")
    expect(body.data.id).toBeDefined()
  })

  test("should return 400 if name or email missing", async () => {
    const event = {
      body: JSON.stringify({ name: "Only name" }),
    }

    const result = await createOrganization(event, mockHeaders)

    expect(result.statusCode).toBe(400)

    const body = JSON.parse(result.body)

    expect(body.notification.error).toBe(true)
    expect(body.notification.message).toBe("Name and email are required")
  })

  test("should return 404 if email not found in member table", async () => {
    ddbMock.on(ScanCommand).resolves({ Items: [] })

    const event = {
      body: JSON.stringify({
        name: "Org Test",
        email: "notfound@example.com",
      }),
    }

    const result = await createOrganization(event, mockHeaders)

    expect(result.statusCode).toBe(404)

    const body = JSON.parse(result.body)

    expect(body.notification.error).toBe(true)
    expect(body.notification.message).toBe("Member with this email not found")
  })

  test("should return 500 on unexpected error", async () => {
    ddbMock.on(ScanCommand).rejects(new Error("Unexpected Error"))

    const event = {
      body: JSON.stringify({
        name: "Org Test",
        email: "test@example.com",
      }),
    }

    const result = await createOrganization(event, mockHeaders)

    expect(result.statusCode).toBe(500)

    const body = JSON.parse(result.body)

    expect(body.notification.error).toBe(true)
    expect(body.notification.message).toBe("Internal Server Error")
  })
})
