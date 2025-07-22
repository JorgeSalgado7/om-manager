import { updateOrganization } from "../organization/updateOrganization"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb"
import { mockClient } from "aws-sdk-client-mock"
import "aws-sdk-client-mock-jest"

const ddbMock = mockClient(DynamoDBClient)

describe("updateOrganization Lambda", () => {

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

    const result = await updateOrganization(event)

    expect(result.statusCode).toBe(200)

    const body = JSON.parse(result.body)

    expect(body.message).toBe("Organization updated")

  })

  test("should return 400 if id or name missing", async () => {

    const event = {
      body: JSON.stringify({ id: "org-123" }),
    }

    const result = await updateOrganization(event)

    expect(result.statusCode).toBe(400)

    const body = JSON.parse(result.body)

    expect(body.error).toBe("Organization id and new name are required")

  })

  test("should return 404 if organization not found", async () => {

    ddbMock.on(UpdateCommand).rejects({ name: "ConditionalCheckFailedException" })

    const event = {
      body: JSON.stringify({
        id: "org-unknown",
        name: "Name",
      }),
    }

    const result = await updateOrganization(event)

    expect(result.statusCode).toBe(404)

    const body = JSON.parse(result.body)

    expect(body.error).toBe("Organization not found")

  })

})
