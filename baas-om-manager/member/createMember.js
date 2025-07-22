import * as dotenv from "dotenv"
dotenv.config()

import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb"
import { v4 as uuidv4 } from "uuid"

const client = new DynamoDBClient({})
const ddbDocClient = DynamoDBDocumentClient.from(client)

const MEMBERS_TABLE = process.env.MEMBERS_TABLE_NAME

export const createMember = async (event) => {

  try {

    const body = JSON.parse(event.body || '{}')
    const { email } = body

    if (!email) {

      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Email is required" }),
      }

    }

    const memberItem = {
      id: uuidv4(),
      email,
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    await ddbDocClient.send(new PutCommand({
      TableName: MEMBERS_TABLE,
      Item: memberItem,
      ConditionExpression: 'attribute_not_exists(email)',
    }))

    return {
      statusCode: 201,
      body: JSON.stringify({ message: "Member created", member: memberItem }),
    }

  } 
	catch (error) {

    if (error.name === 'ConditionalCheckFailedException') {
      return {
        statusCode: 409,
        body: JSON.stringify({ error: "Member with this email already exists" }),
      }
    }

    console.error(error)

    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
    }

  }

}
