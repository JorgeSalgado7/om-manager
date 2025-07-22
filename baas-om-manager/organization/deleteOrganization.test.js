import { deleteOrganization } from "../organization/deleteOrganization"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import {
  DynamoDBDocumentClient,
  DeleteCommand,
  QueryCommand,
  BatchWriteCommand,
} from "@aws-sdk/lib-dynamodb"
import { mockClient } from "aws-sdk-client-mock"
import "aws-sdk-client-mock-jest"

const ddbMock = mockClient(DynamoDBClient)

describe("deleteOrganization Lambda", () => {
  beforeEach(() => {
    ddbMock.reset()
  })

  test("should delete organization and related member organizations", async () => {
    ddbMock.on(DeleteCommand).resolves({})
    ddbMock.on(QueryCommand).resolves({
      Items: [
        { id: "mo-1", id_member: "member1", id_organization: "org-123", role: "owner" },
        { id: "mo-2", id_member: "member2", id_organization: "org-123", role: "member" },
      ],
      LastEvaluatedKey: undefined,
    })
    ddbMock.on(BatchWriteCommand).resolves({})

    const event = {
      body: JSON.stringify({ id: "org-123" }),
    }

    const result = await deleteOrganization(event)

    expect(result.statusCode).toBe(200)

    const body = JSON.parse(result.body)

    expect(body.notification).toEqual({
      error: false,
      message: "Organization and related members deleted",
    })
  })

  test("should return 400 if no id provided", async () => {
    const event = { body: JSON.stringify({}) }

    const result = await deleteOrganization(event)

    expect(result.statusCode).toBe(400)

    const body = JSON.parse(result.body)

    expect(body.notification).toEqual({
      error: true,
      message: "Organization id is required",
    })
  })

  test("should return 404 if organization not found", async () => {
    ddbMock.on(DeleteCommand).rejects({ name: "ConditionalCheckFailedException" })

    const event = {
      body: JSON.stringify({ id: "org-unknown" }),
    }

    const result = await deleteOrganization(event)

    expect(result.statusCode).toBe(404)

    const body = JSON.parse(result.body)

    expect(body.notification).toEqual({
      error: true,
      message: "Organization not found",
    })
  })
})
