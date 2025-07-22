import { getOrganizationsByEmail } from "../organization/getOrganizationsByEmail"
import { DynamoDBDocumentClient, ScanCommand, QueryCommand, BatchGetCommand } from "@aws-sdk/lib-dynamodb"
import { mockClient } from "aws-sdk-client-mock"
import "aws-sdk-client-mock-jest"

const ddbDocMock = mockClient(DynamoDBDocumentClient)

describe("getOrganizationsByEmail Lambda", () => {
  beforeEach(() => {
    ddbDocMock.reset()
  })

  test("should return 400 if email is missing", async () => {
    const event = { body: JSON.stringify({}) }
    const result = await getOrganizationsByEmail(event)

    expect(result.statusCode).toBe(400)
    const body = JSON.parse(result.body)
    expect(body.notification.error).toBe(true)
    expect(body.notification.message).toBe("Email is required")
  })

  test("should return 404 if member not found", async () => {
    ddbDocMock.on(ScanCommand).resolves({ Items: [] })

    const event = { body: JSON.stringify({ email: "noone@example.com" }) }
    const result = await getOrganizationsByEmail(event)

    expect(result.statusCode).toBe(404)
    const body = JSON.parse(result.body)
    expect(body.notification.error).toBe(true)
    expect(body.notification.message).toBe("Member not found")
  })

  test("should return 404 if no organizations found for member", async () => {
    ddbDocMock.on(ScanCommand).resolves({ Items: [{ id: "member-123" }] })
    ddbDocMock.on(QueryCommand).resolves({ Items: [], LastEvaluatedKey: undefined })

    const event = { body: JSON.stringify({ email: "member@example.com" }) }
    const result = await getOrganizationsByEmail(event)

    expect(result.statusCode).toBe(404)
    const body = JSON.parse(result.body)
    expect(body.notification.error).toBe(true)
    expect(body.notification.message).toBe("No organizations found for member")
  })

  test("should return organizations with roles", async () => {
    ddbDocMock.on(ScanCommand).resolves({ Items: [{ id: "member-123" }] })

    ddbDocMock.on(QueryCommand).resolves({
      Items: [
        { id: "mo-1", id_member: "member-123", id_organization: "org-1", role: "owner" },
        { id: "mo-2", id_member: "member-123", id_organization: "org-2", role: "member" },
      ],
      LastEvaluatedKey: undefined,
    })

    ddbDocMock.on(BatchGetCommand).resolves({
      Responses: {
        "om-organization": [
          { id: "org-1", name: "Org One", created_at: "2024-01-01", updated_at: "2024-01-02" },
          { id: "org-2", name: "Org Two", created_at: "2024-01-03", updated_at: "2024-01-04" },
        ],
      },
    })

    const event = { body: JSON.stringify({ email: "member@example.com" }) }
    const result = await getOrganizationsByEmail(event)

    expect(result.statusCode).toBe(200)

    const body = JSON.parse(result.body)

    expect(body.notification.error).toBe(false)
    expect(body.notification.message).toBe("Found 2 organizations for member")

    expect(body.data).toHaveLength(2)
    expect(body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "org-1", role: "owner" }),
        expect.objectContaining({ id: "org-2", role: "member" }),
      ])
    )
  })

  test("should return 500 on internal error", async () => {
    ddbDocMock.on(ScanCommand).rejects(new Error("Unexpected error"))

    const event = { body: JSON.stringify({ email: "error@example.com" }) }
    const result = await getOrganizationsByEmail(event)

    expect(result.statusCode).toBe(500)
    const body = JSON.parse(result.body)
    expect(body.notification.error).toBe(true)
    expect(body.notification.message).toBe("Internal Server Error")
  })
})
