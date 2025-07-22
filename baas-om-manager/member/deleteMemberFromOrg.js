import * as dotenv from "dotenv"
dotenv.config()

import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, DeleteCommand } from "@aws-sdk/lib-dynamodb"
import { notificationResponse } from "../utils/notificationResponse.js"

const client = new DynamoDBClient({})
const ddbDocClient = DynamoDBDocumentClient.from(client)

const MEMBER_ORG_TABLE = process.env.MEMBER_ORGANIZATION_TABLE_NAME

export const deleteMemberFromOrganization = async (event, headers) => {
  try {
    const body = JSON.parse(event.body || '{}')
    const { id_member_org } = body

    if (!id_member_org) {
      return {
        statusCode: 400,
        headers,
        body: notificationResponse(null, true, "id_member_org is required"),
      }
    }

    const params = {
      TableName: MEMBER_ORG_TABLE,
      Key: { id: id_member_org },
      ConditionExpression: "attribute_exists(id)"
    }

    await ddbDocClient.send(new DeleteCommand(params))

    return {
      statusCode: 200,
      headers,
      body: notificationResponse({ id: id_member_org }, false, "Member removed from organization"),
    }

  } catch (error) {
    console.error(error)

    if (error.name === "ConditionalCheckFailedException") {
      return {
        statusCode: 404,
        headers,
        body: notificationResponse(null, true, "Member not found in organization"),
      }
    }

    return {
      statusCode: 500,
      headers,
      body: notificationResponse(null, true, "Internal Server Error"),
    }
  }
}
