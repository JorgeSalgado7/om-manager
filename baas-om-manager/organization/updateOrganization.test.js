import { updateOrganization } from "../organization/updateOrganization"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { UpdateCommand } from "@aws-sdk/lib-dynamodb"
import { mockClient } from "aws-sdk-client-mock"
import "aws-sdk-client-mock-jest"

const ddbMock = mockClient(DynamoDBClient)

describe("updateOrganization Lambda", () => {
  const headers = { "Content-Type": "application/json" }

  beforeEach(() => {
    ddbMock.reset()
  })

  test("should update organization name", async () => {
    ddbMock.on(UpdateCommand).resolves({
      Attributes: {
        id: "org-123",
        name: "New Org Name",
        updated_at: new Date().toISOString(),
      },
    })

    const event = {
      body: JSON.stringify({
        id: "org-123",
        name: "New Org Name",
      }),
    }

    const result = await updateOrganization(event, headers)

    expect(result.statusCode).toBe(200)
    expect(result.headers).toEqual(headers)

    const body = JSON.parse(result.body)
    expect(body.notification.error).toBe(false)
    expect(body.notification.message).toBe("Organization updated successfully")
    expect(body.data.id).toBe("org-123")
    expect(body.data.name).toBe("New Org Name")
  })

  test("should return 400 if id or name missing", async () => {
    const event = {
      body: JSON.stringify({ id: "org-123" }),
    }

    const result = await updateOrganization(event, headers)

    expect(result.statusCode).toBe(400)
    expect(result.headers).toEqual(headers)

    const body = JSON.parse(result.body)
    expect(body.notification.error).toBe(true)
    expect(body.notification.message).toBe("Organization id and name are required")
  })

  test("should return 404 if organization not found", async () => {
    ddbMock.on(UpdateCommand).rejects({ name: "ConditionalCheckFailedException" })

    const event = {
      body: JSON.stringify({
        id: "org-unknown",
        name: "Name",
      }),
    }

    const result = await updateOrganization(event, headers)

    expect(result.statusCode).toBe(404)
    expect(result.headers).toEqual(headers)

    const body = JSON.parse(result.body)
    expect(body.notification.error).toBe(true)
    expect(body.notification.message).toBe("Organization not found")
  })

  test("should return 500 on internal error", async () => {
    ddbMock.on(UpdateCommand).rejects(new Error("Unexpected error"))

    const event = {
      body: JSON.stringify({
        id: "org-123",
        name: "Name",
      }),
    }

    const result = await updateOrganization(event, headers)

    expect(result.statusCode).toBe(500)
    expect(result.headers).toEqual(headers)

    const body = JSON.parse(result.body)
    expect(body.notification.error).toBe(true)
    expect(body.notification.message).toBe("Internal Server Error")
  })
})
