import * as dotenv from "dotenv"
dotenv.config()

import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import {
  DynamoDBDocumentClient,
  DeleteCommand,
  QueryCommand,
  BatchWriteCommand,
} from "@aws-sdk/lib-dynamodb"

const client = new DynamoDBClient({})
const ddbDocClient = DynamoDBDocumentClient.from(client)

const ORGANIZATION_TABLE = process.env.ORGANIZATION_TABLE
const MEMBER_ORG_TABLE = process.env.MEMBER_ORGANIZATION_TABLE

export const deleteOrganization = async (event) => {

  try {

    const { id } = event.pathParameters || {}

    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Organization id is required" }),
      }
    }

    await ddbDocClient.send(new DeleteCommand({
      TableName: ORGANIZATION_TABLE,
      Key: { id },
      ConditionExpression: 'attribute_exists(id)',
    }))

    const memberOrgItems = []

    let lastEvaluatedKey = undefined

    do {

      const result = await ddbDocClient.send(new QueryCommand({
        TableName: MEMBER_ORG_TABLE,
        IndexName: 'ByOrganizationId',
        KeyConditionExpression: 'id_organization = :id',
        ExpressionAttributeValues: {
          ':id': id,
        },
        ExclusiveStartKey: lastEvaluatedKey,
      }))

      if (result.Items) {
        memberOrgItems.push(...result.Items)
      }

      lastEvaluatedKey = result.LastEvaluatedKey

    } while (lastEvaluatedKey)

    if (memberOrgItems.length > 0) {

      const deleteRequests = memberOrgItems.map(item => ({
        DeleteRequest: {
          Key: { id: item.id },
        },
      }))

      for (let i = 0; i < deleteRequests.length; i += 25) {
        const batch = deleteRequests.slice(i, i + 25)

        await ddbDocClient.send(new BatchWriteCommand({
          RequestItems: {
            [MEMBER_ORG_TABLE]: batch,
          },
        }))
      }

    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Organization and related members deleted" }),
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
