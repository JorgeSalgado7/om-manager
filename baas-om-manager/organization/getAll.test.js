import { getOrganizations } from "../organizations/getOrganizations.js"
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb"
import { notificationResponse } from "../utils/notificationResponse.js"
import { ScanCommand } from "@aws-sdk/lib-dynamodb"

jest.mock("@aws-sdk/lib-dynamodb", () => {
  const actual = jest.requireActual("@aws-sdk/lib-dynamodb")
  return {
    ...actual,
    DynamoDBDocumentClient: {
      from: jest.fn(() => ({
        send: jest.fn()
      }))
    }
  }
})

describe("getOrganizations", () => {
  let sendMock
  const headers = { "Access-Control-Allow-Origin": "*" }

  beforeEach(() => {
    sendMock = jest.fn()
    DynamoDBDocumentClient.from.mockReturnValue({ send: sendMock })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test("should return organizations with id and name", async () => {
    sendMock.mockResolvedValueOnce({
      Items: [
        { id: "org1", name: "Organization One" },
        { id: "org2", name: "Organization Two" },
      ]
    })

    const response = await getOrganizations({}, headers)

    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body)).toEqual(
      notificationResponse(
        [
          { id: "org1", name: "Organization One" },
          { id: "org2", name: "Organization Two" }
        ],
        false,
        null
      )
    )
  })

  test("should return 500 on error", async () => {
    sendMock.mockRejectedValueOnce(new Error("Dynamo error"))

    const response = await getOrganizations({}, headers)

    expect(response.statusCode).toBe(500)
    expect(JSON.parse(response.body)).toEqual(
      notificationResponse(null, true, "Internal Server Error")
    )
  })
})
