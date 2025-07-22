import { ScanCommand } from "@aws-sdk/lib-dynamodb"
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb"
import { notificationResponse } from "../utils/notificationResponse.js"

const client = DynamoDBDocumentClient.from()

const ORGANIZATION_TABLE = process.env.ORGANIZATION_TABLE

export const getAll = async (event, headers) => {
  try {
    const command = new ScanCommand({
      TableName: ORGANIZATION_TABLE,
      ProjectionExpression: "id, #name",
      ExpressionAttributeNames: { "#name": "name" }
    })

    const result = await client.send(command)

    const organizations = result.Items || []

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(notificationResponse(organizations, false, null)),
    }
  } catch (error) {
    console.error("Error in getOrganizations:", error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify(notificationResponse(null, true, "Internal Server Error")),
    }
  }
}
