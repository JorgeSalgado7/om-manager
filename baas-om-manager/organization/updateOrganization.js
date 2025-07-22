import * as dotenv from "dotenv"
dotenv.config()

import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb"

const client = new DynamoDBClient({})
const ddbDocClient = DynamoDBDocumentClient.from(client)

const ORGANIZATION_TABLE = process.env.ORGANIZATION_TABLE

export const updateOrganization = async (event) => {

  try {

    const body = JSON.parse(event.body || '{}')
    const { id, name } = body

    if (!id || !name) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Organization id and new name are required" }),
      }
    }

    const now = new Date().toISOString()

    await ddbDocClient.send(new UpdateCommand({
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
      body: JSON.stringify({ message: "Organization updated" }),
    }

  }
  catch (error) {

    if (error.name === 'ConditionalCheckFailedException') {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Organization not found" }),
      }
    }

    console.error(error)

    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
    }

  }

}
