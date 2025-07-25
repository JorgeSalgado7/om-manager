import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import {
  DynamoDBDocumentClient,
  DeleteCommand,
  QueryCommand,
  BatchWriteCommand,
} from "@aws-sdk/lib-dynamodb"
import { notificationResponse } from "../utils/notificationResponse.js"

const ORGANIZATION_TABLE = process.env.ORGANIZATION_TABLE_NAME
const MEMBER_ORGANIZATION_TABLE = process.env.MEMBER_ORGANIZATION_TABLE_NAME

export const deleteOrganization = async (event, headers) => {

  try {

		const client = new DynamoDBClient({})
		const ddbDocClient = DynamoDBDocumentClient.from(client)

    const body = JSON.parse(event.body || '{}')
    const { id } = body

    if (!id) {
      return {
        statusCode: 400,
        headers,
        body: notificationResponse(null, true, "Organization id is required")
      }
    }

    await ddbDocClient.send(
      new DeleteCommand({
        TableName: ORGANIZATION_TABLE,
        Key: { id },
        ConditionExpression: "attribute_exists(id)",
      })
    )

    const memberOrgItems = []
    let lastEvaluatedKey

    do {
      const result = await ddbDocClient.send(
        new QueryCommand({
          TableName: MEMBER_ORGANIZATION_TABLE,
          IndexName: "ByOrganizationId",
          KeyConditionExpression: "id_organization = :id",
          ExpressionAttributeValues: {
            ":id": id,
          },
          ExclusiveStartKey: lastEvaluatedKey,
        })
      )

      if (result.Items) memberOrgItems.push(...result.Items)
      lastEvaluatedKey = result.LastEvaluatedKey
    } while (lastEvaluatedKey)

    if (memberOrgItems.length > 0) {
      const deleteRequests = memberOrgItems.map((item) => ({
        DeleteRequest: {
          Key: { id: item.id },
        },
      }))

      for (let i = 0; i < deleteRequests.length; i += 25) {
        const batch = deleteRequests.slice(i, i + 25)

        await ddbDocClient.send(
          new BatchWriteCommand({
            RequestItems: {
              [MEMBER_ORGANIZATION_TABLE]: batch,
            },
          })
        )
      }
    }

    return {
      statusCode: 200,
      headers,
      body: notificationResponse(
        { deletedId: id },
        false, 
				"Organization and related members deleted"
      ),
    }
  } catch (error) {
    console.error("DELETE ORG ERROR:", error)

    if (error.name === "ConditionalCheckFailedException") {
      return {
        statusCode: 404,
        headers,
        body: notificationResponse(null, true, "Organization not found"),
      }
    }

    return {
      statusCode: 500,
      headers,
      body: notificationResponse(null,true,"Internal Server Error"),
    }
  }
}
