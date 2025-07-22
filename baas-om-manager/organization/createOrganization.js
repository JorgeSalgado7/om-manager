import * as dotenv from "dotenv"
dotenv.config()

import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb"
import { v4 as uuidv4 } from "uuid"

const client = new DynamoDBClient({})
const ddbDocClient = DynamoDBDocumentClient.from(client)

const ORGANIZATION_TABLE = process.env.ORGANIZATION_TABLE
const MEMBER_ORG_TABLE = process.env.MEMBER_ORG_TABLE

export const createOrganization = async (event) => {

  try {

    const body = JSON.parse(event.body || '{}')
    const { name, memberId } = body

    if (!name || !memberId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Name and memberId are required" }),
      }
    }

    const orgId = uuidv4()
    const now = new Date().toISOString()

    const organizationItem = {
      id: orgId,
      name,
      id_owner: memberId,
      created_at: now,
      updated_at: now,
    }

    await ddbDocClient.send(new PutCommand({
      TableName: ORGANIZATION_TABLE,
      Item: organizationItem,
      ConditionExpression: 'attribute_not_exists(id)',
    }))

    const memberOrgItem = {
      id: uuidv4(),
      id_member: memberId,
      id_organization: orgId,
      role: "owner",
      created_at: now,
      updated_at: now,
    }

    await ddbDocClient.send(new PutCommand({
      TableName: MEMBER_ORG_TABLE,
      Item: memberOrgItem,
    }))

    return {
      statusCode: 201,
      body: JSON.stringify({ message: "Organization created", organization: organizationItem }),
    }

  } 
  catch (error) {

    if (error.name === 'ConditionalCheckFailedException') {
      return {
        statusCode: 409,
        body: JSON.stringify({ error: "Organization with this ID already exists" }),
      }
    }

    console.error(error)

    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
    }

  }

}
