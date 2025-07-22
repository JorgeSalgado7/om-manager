import { createOrganization } from "../organization/createOrganization"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb"
import { mockClient } from "aws-sdk-client-mock"
import "aws-sdk-client-mock-jest"

const ddbMock = mockClient(DynamoDBClient)

describe("createOrganization Lambda", () => {

  beforeEach(() => {
    ddbMock.reset()
  })

  test("should create organization and member organization relation", async () => {

    ddbMock.on(PutCommand).resolves({})

    const event = {
      body: JSON.stringify({
        name: "Org Test",
        memberId: "member-123",
      }),
    }

    const result = await createOrganization(event)

    expect(result.statusCode).toBe(201)

    const body = JSON.parse(result.body)

    expect(body.message).toBe("Organization created")
    expect(body.organization.name).toBe("Org Test")
    expect(body.organization.id_owner).toBe("member-123")

  })

  test("should return 400 if name or memberId missing", async () => {

    const event = {
      body: JSON.stringify({ name: "Only name" }),
    }

    const result = await createOrganization(event)

    expect(result.statusCode).toBe(400)

    const body = JSON.parse(result.body)

    expect(body.error).toBe("Name and memberId are required")

  })

})

