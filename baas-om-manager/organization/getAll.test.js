import { getAll } from "../organization/getAll.js"  // ajusta la ruta según tu estructura
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb"
import { notificationResponse } from "../utils/notificationResponse.js"

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

describe("getAll", () => {
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

    const response = await getAll({}, headers)

    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body)).toEqual(
      JSON.stringify(notificationResponse(
        [
          { id: "org1", name: "Organization One" },
          { id: "org2", name: "Organization Two" }
        ],
        false,
        null
      ))
    )
  })

  test("should return 500 on error", async () => {
    sendMock.mockRejectedValueOnce(new Error("Dynamo error"))

    const response = await getAll({}, headers)

    expect(response.statusCode).toBe(500)
    expect(JSON.parse(response.body)).toEqual(
      JSON.parse(JSON.stringify(notificationResponse(null, true, "Internal Server Error")))
    )
  })
})
