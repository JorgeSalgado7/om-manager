import * as dotenv from "dotenv"
dotenv.config()

import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb"

const client = new DynamoDBClient({})
const ddbDocClient = DynamoDBDocumentClient.from(client)

const MEMBER_ORG_TABLE = process.env.MEMBER_ORG_TABLE

export const updateMemberRole = async (event) => {

  try {

    const body = JSON.parse(event.body || '{}')
    const { id_member_org, role } = body

    if (!id_member_org || !role) {

      return {
        statusCode: 400,
        body: JSON.stringify({ error: "id_member_org and role are required" }),
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
      body: JSON.stringify({ message: "Role updated", updatedItem: result.Attributes }),
    }

  } 
  catch (error) {

    console.error(error)

    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
    }

  }

}
