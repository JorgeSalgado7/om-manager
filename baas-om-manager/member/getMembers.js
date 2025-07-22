import * as dotenv from "dotenv"
dotenv.config()

import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, ScanCommand, QueryCommand, GetCommand } from "@aws-sdk/lib-dynamodb"

const client = new DynamoDBClient({})
const ddbDocClient = DynamoDBDocumentClient.from(client)

const MEMBERS_TABLE = process.env.MEMBERS_TABLE
const MEMBER_ORG_TABLE = process.env.MEMBER_ORGANIZATION_TABLE
const ORGANIZATION_TABLE = process.env.ORGANIZATION_TABLE

export const listMembersWithOrganizations = async (event) => {

  try {

    const membersData = await ddbDocClient.send(new ScanCommand({
      TableName: MEMBERS_TABLE,
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
      body: JSON.stringify(results),
    }

  } catch (error) {
    console.error(error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    }
  }

}
