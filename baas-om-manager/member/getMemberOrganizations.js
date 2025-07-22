import * as dotenv from 'dotenv'
dotenv.config()

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, QueryCommand, BatchGetCommand } from '@aws-sdk/lib-dynamodb'

const client = new DynamoDBClient({})
const ddbDocClient = DynamoDBDocumentClient.from(client)

const MEMBER_ORG_TABLE = process.env.MEMBER_ORG_TABLE
const ORGANIZATION_TABLE = process.env.ORGANIZATION_TABLE

export const getMemberOrganizations = async (event) => {

  try {

    const { id_member } = event.queryStringParameters || {}

    if (!id_member) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'id_member is required' }),
      }
    }

    const queryParams = {
      TableName: MEMBER_ORG_TABLE,
      IndexName: 'ByMemberId',
      KeyConditionExpression: 'id_member = :id_member',
      ExpressionAttributeValues: {
        ':id_member': id_member,
      },
    }

    const memberOrgResult = await ddbDocClient.send(new QueryCommand(queryParams))

    if (!memberOrgResult.Items || memberOrgResult.Items.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({ organizations: [] }),
      }
    }

    const orgIds = memberOrgResult.Items.map(item => item.id_organization)

    const keys = orgIds.map(id => ({ id }))

    const batchGetParams = {
      RequestItems: {
        [ORGANIZATION_TABLE]: {
          Keys: keys,
        },
      },
    }

    const orgResult = await ddbDocClient.send(new BatchGetCommand(batchGetParams))

    const organizations = memberOrgResult.Items.map(memberOrgItem => {

      const org = orgResult.Responses?.[ORGANIZATION_TABLE]?.find(o => o.id === memberOrgItem.id_organization)

      return {
        id: org?.id || memberOrgItem.id_organization,
        name: org?.name || null,
        role: memberOrgItem.role,
      }
    })

    return {
      statusCode: 200,
      body: JSON.stringify({ organizations }),
    }

  } catch (error) {

    console.error(error)

    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    }

  }

}
