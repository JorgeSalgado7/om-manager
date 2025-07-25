import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb"
import { v4 as uuidv4 } from "uuid"
import { notificationResponse } from "../utils/notificationResponse.js"

const ORGANIZATION_TABLE = process.env.ORGANIZATION_TABLE_NAME
const MEMBER_ORG_TABLE = process.env.MEMBER_ORGANIZATION_TABLE_NAME
const MEMBER_TABLE = process.env.MEMBER_TABLE_NAME

export const createOrganization = async (event, headers) => {

  try {

		const client = new DynamoDBClient({})
		const ddbDocClient = DynamoDBDocumentClient.from(client)

    const body = JSON.parse(event.body || '{}')
    const { name, email } = body

    if (!name || !email) {
      return {
        statusCode: 400,
				headers,
        body: notificationResponse(null, true, "Name and email are required" ),
      }
    }

    const scanResult = await ddbDocClient.send(new ScanCommand({
      TableName: MEMBER_TABLE,
      FilterExpression: "email = :email",
      ExpressionAttributeValues: {
        ":email": email,
      },
      ProjectionExpression: "id",
    }))

    if (!scanResult.Items || scanResult.Items.length === 0) {
      return {
        statusCode: 404,
				headers,
        body: notificationResponse(null, true, "Member with this email not found" ),
      }
    }

    const memberId = scanResult.Items[0].id

    const orgId = uuidv4()
    const now = new Date().toISOString()

    const organizationItem = {
      id: orgId,
      name,
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
			headers,
      body: notificationResponse(organizationItem, false, null),
    }

  } catch (error) {
    if (error.name === 'ConditionalCheckFailedException') {
      return {
        statusCode: 409,
				headers,
        body: notificationResponse(null, true, "Organization with this ID already exists"),
      }
    }

    console.error(error)

    return {
      statusCode: 500,
			headers,
      body: notificationResponse(null, true, "Internal Server Error" ),
    }
  }
}
