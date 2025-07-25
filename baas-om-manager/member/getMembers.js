import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, ScanCommand, QueryCommand, GetCommand } from "@aws-sdk/lib-dynamodb"
import { notificationResponse } from "../utils/notificationResponse.js"

const ORGANIZATION_TABLE = process.env.ORGANIZATION_TABLE_NAME
const MEMBER_ORG_TABLE = process.env.MEMBER_ORGANIZATION_TABLE_NAME
const MEMBER_TABLE = process.env.MEMBER_TABLE_NAME

export const getMembers = async (event, headers) => {

  try {

		const client = new DynamoDBClient({})
		const ddbDocClient = DynamoDBDocumentClient.from(client)

    const membersData = await ddbDocClient.send(new ScanCommand({
      TableName: MEMBER_TABLE,
    }))

    const members = membersData.Items || []

    const results = await Promise.all(members.map(async (member) => {

      const memberOrgsData = await ddbDocClient.send(new QueryCommand({
        TableName: MEMBER_ORG_TABLE,
        IndexName: 'ByMemberId',
        KeyConditionExpression: 'id_member = :memberId',
        ExpressionAttributeValues: {
          ':memberId': member.id,
        },
      }))

      const memberOrgs = memberOrgsData.Items || []

      const orgsWithRoles = await Promise.all(memberOrgs.map(async (mo) => {
        const orgData = await ddbDocClient.send(new GetCommand({
          TableName: ORGANIZATION_TABLE,
          Key: { id: mo.id_organization },
        }))
        return {
          id_member_role: mo.id,  // <-- Aquí el id del registro relación miembro-organización
          id: mo.id_organization,
          name: orgData.Item?.name || 'Unknown',
          role: mo.role,
        }
      }))

      return {
        id: member.id,
        email: member.email,
        status: member.status,
        organizations: orgsWithRoles,
      }

    }))

    return {
      statusCode: 200,
      headers,
      body: notificationResponse(results, false, null),
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
