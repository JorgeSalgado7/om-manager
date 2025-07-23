import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb"
import { notificationResponse } from "../utils/notificationResponse.js"

const client = new DynamoDBClient({})
const ddbDocClient = DynamoDBDocumentClient.from(client)

const ORGANIZATION_TABLE = process.env.ORGANIZATION_TABLE_NAME

export const getAll = async (event, headers) => {

  try {
    const command = new ScanCommand({
      TableName: ORGANIZATION_TABLE,
      ProjectionExpression: "id, #name",
      ExpressionAttributeNames: { "#name": "name" }
    })

    const result = await ddbDocClient.send(command)

    const organizations = result.Items || []

    return {
      statusCode: 200,
      headers,
      body: notificationResponse(organizations, false, null),
    }
  } 
	catch (error) {
    console.error("Error in getOrganizations:", error)
    return {
      statusCode: 500,
      headers,
      body: notificationResponse(null, true, "Internal Server Error"),
    }

  }

}
