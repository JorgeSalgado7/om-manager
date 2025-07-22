import { createMember } from "../createMember"
import { PutCommand } from "@aws-sdk/lib-dynamodb"

jest.mock("@aws-sdk/lib-dynamodb", () => {

  const originalModule = jest.requireActual("@aws-sdk/lib-dynamodb")
	
  return {
    ...originalModule,
    DynamoDBDocumentClient: {
      from: jest.fn().mockReturnValue({
        send: jest.fn((command) => {
          if (command instanceof PutCommand) {
            return Promise.resolve({})
          }
          return Promise.reject(new Error("Unknown command"))
        }),
      }),
    },
  }
})

describe("createMember Lambda", () => {

  it("should return 400 if email is missing", async () => {
    const event = { body: JSON.stringify({}) }
    const response = await createMember(event)
    expect(response.statusCode).toBe(400)
    expect(JSON.parse(response.body)).toEqual({ error: "Email is required" })
  })

  it("should return 201 and create member", async () => {
    const event = { body: JSON.stringify({ email: "test@example.com" }) }
    const response = await createMember(event)
    const body = JSON.parse(response.body)

    expect(response.statusCode).toBe(201)
    expect(body.message).toBe("Member created")
    expect(body.member.email).toBe("test@example.com")
    expect(body.member.id).toBeDefined()
    expect(body.member.status).toBe("active")
    expect(body.member.created_at).toBeDefined()
    expect(body.member.updated_at).toBeDefined()
  })

})
