import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb"
import { notificationResponse } from "../utils/notificationResponse.js"

const MEMBER_ORG_TABLE = process.env.MEMBER_ORGANIZATION_TABLE_NAME

export const updateMemberRole = async (event, headers) => {

  try {

		const client = new DynamoDBClient({})
		const ddbDocClient = DynamoDBDocumentClient.from(client)

    const body = JSON.parse(event.body || '{}')
    const { id_member_org, role } = body

    if (!id_member_org || !role) {
      return {
        statusCode: 400,
        headers,
        body: notificationResponse(null, true, "id_member_org and role are required"),
      }
    }

    const params = {
      TableName: MEMBER_ORG_TABLE,
      Key: { id: id_member_org },
      UpdateExpression: "set #r = :r",
      ExpressionAttributeNames: { "#r": "role" },
      ExpressionAttributeValues: { ":r": role },
      ReturnValues: "ALL_NEW",
    }

    const result = await ddbDocClient.send(new UpdateCommand(params))

    return {
      statusCode: 200,
      headers,
      body: notificationResponse({ updatedItem: result.Attributes }, false, "Role updated"),
    }

  } catch (error) {
    console.error(error)
    return {
      statusCode: 500,
      headers,
      body: notificationResponse(null, true, "Internal Server Error"),
    }
  }
}
