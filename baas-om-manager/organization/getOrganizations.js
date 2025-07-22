import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import {
  DynamoDBDocumentClient,
  ScanCommand,
  QueryCommand,
  BatchGetCommand,
} from "@aws-sdk/lib-dynamodb"
import { notificationResponse } from "../utils/notificationResponse.js"

const client = new DynamoDBClient({})
const ddbDocClient = DynamoDBDocumentClient.from(client)

const MEMBER_TABLE = process.env.MEMBER_TABLE_NAME
const MEMBER_ORG_TABLE = process.env.MEMBER_ORGANIZATION_TABLE_NAME
const ORGANIZATION_TABLE = process.env.ORGANIZATION_TABLE_NAME

export const getOrganizationsByEmail = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Credentials": true,
    "Content-Type": "application/json",
  }

  try {
    const body = JSON.parse(event.body || "{}")
    const { email } = body

    if (!email) {
      return {
        statusCode: 400,
        headers,
        body: notificationResponse(null, true, "Email is required"),
      }
    }

    const scanResult = await ddbDocClient.send(
      new ScanCommand({
        TableName: MEMBER_TABLE,
        FilterExpression: "email = :email",
        ExpressionAttributeValues: { ":email": email },
        ProjectionExpression: "id",
      })
    )

    if (!scanResult.Items || scanResult.Items.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: notificationResponse(null, true,"Member not found" ),
      }
    }

    const memberId = scanResult.Items[0].id

    let memberOrgItems = []
    let lastEvaluatedKey = undefined

    do {
      const queryResult = await ddbDocClient.send(
        new QueryCommand({
          TableName: MEMBER_ORG_TABLE,
          IndexName: "ByMemberId",
          KeyConditionExpression: "id_member = :memberId",
          ExpressionAttributeValues: {
            ":memberId": memberId,
          },
          ExclusiveStartKey: lastEvaluatedKey,
        })
      )

      if (queryResult.Items) memberOrgItems.push(...queryResult.Items)
      lastEvaluatedKey = queryResult.LastEvaluatedKey
    } while (lastEvaluatedKey)

    if (memberOrgItems.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: notificationResponse(null, true, "No organizations found for member"),
      }
    }

    const orgKeys = memberOrgItems.map((item) => ({ id: item.id_organization }))

    const batchGetResult = await ddbDocClient.send(
      new BatchGetCommand({
        RequestItems: {
          [ORGANIZATION_TABLE]: {
            Keys: orgKeys,
          },
        },
      })
    )

    const organizations = batchGetResult.Responses?.[ORGANIZATION_TABLE] || []

    const responseList = organizations.map((org) => {
      const memberOrg = memberOrgItems.find((mo) => mo.id_organization === org.id)
      return {
        ...org,
        role: memberOrg?.role || null,
      }
    })

    return {
      statusCode: 200,
      headers,
      body: notificationResponse(responseList, false, `Found ${responseList.length} organizations for member`),
    }
  } catch (error) {
    console.error("Error in getOrganizationsByEmail:", error)
    return {
      statusCode: 500,
      headers,
      body: notificationResponse(null, true, "Internal Server Error"),
    }
  }
}
