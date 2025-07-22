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

const MEMBER_TABLE = process.env.MEMBER_TABLE
const MEMBER_ORG_TABLE = process.env.MEMBER_ORG_TABLE

export const deleteMember = async (event) => {

  try {

    const body = JSON.parse(event.body || '{}')
    const { id_member } = body

    if (!id_member) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "id_member is required" }),
      }
    }

    await ddbDocClient.send(new DeleteCommand({
      TableName: MEMBER_TABLE,
      Key: { id: id_member },
      ConditionExpression: "attribute_exists(id)",
    }))

    const memberOrgItems = []

    let lastEvaluatedKey = undefined

    do {

      const result = await ddbDocClient.send(new QueryCommand({
        TableName: MEMBER_ORG_TABLE,
        IndexName: "ByMemberId",
        KeyConditionExpression: "id_member = :id_member",
        ExpressionAttributeValues: {
          ":id_member": id_member,
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
      body: JSON.stringify({ message: "Member and related organization relations deleted" }),
    }

  }
  catch (error) {

    if (error.name === "ConditionalCheckFailedException") {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Member not found" }),
      }
    }

    console.error(error)

    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
    }

  }

}
