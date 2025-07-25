import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb"
import { notificationResponse } from "../utils/notificationResponse.js"

const ORGANIZATION_TABLE = process.env.ORGANIZATION_TABLE_NAME

export const updateOrganization = async (event, headers) => {

  try {

		const client = new DynamoDBClient({})
		const ddbDocClient = DynamoDBDocumentClient.from(client)

    const body = JSON.parse(event.body || '{}')
    const { id, name } = body

    if (!id || !name) {
      return {
        statusCode: 400,
        headers,
        body: notificationResponse(null, true, "Organization id and name are required"),
      }
    }

    const now = new Date().toISOString()

    const updateResult = await ddbDocClient.send(new UpdateCommand({
      TableName: ORGANIZATION_TABLE,
      Key: { id },
      UpdateExpression: 'set #name = :name, updated_at = :updated_at',
      ExpressionAttributeNames: { '#name': 'name' },
      ExpressionAttributeValues: {
        ':name': name,
        ':updated_at': now,
      },
      ConditionExpression: 'attribute_exists(id)',
      ReturnValues: 'ALL_NEW',
    }))

    return {
      statusCode: 200,
      headers,
      body: notificationResponse(updateResult.Attributes, false, "Organization updated successfully"),
    }

  } catch (error) {
    if (error.name === 'ConditionalCheckFailedException') {
      return {
        statusCode: 404,
        headers,
        body: notificationResponse(null, true,"Organization not found"),
      }
    }

    console.error("Internal Error:", error)

    return {
      statusCode: 500,
      headers,
      body: notificationResponse(null,true,"Internal Server Error"),
    }
  }
}
