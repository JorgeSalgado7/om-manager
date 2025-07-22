import * as dotenv from 'dotenv'
dotenv.config()

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb'

const client = new DynamoDBClient({})
const ddbDocClient = DynamoDBDocumentClient.from(client)

const MEMBER_ORG_TABLE = process.env.MEMBER_ORG_TABLE

export const updateMemberStatus = async (event) => {

  try {

    const { id, status } = JSON.parse(event.body || '{}')

    if (!id || !status) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'id and status are required' }),
      }
    }

    const validStatuses = ['invited', 'active', 'declined', 'expired']

    if (!validStatuses.includes(status)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: `Invalid status. Allowed: ${validStatuses.join(', ')}` }),
      }
    }

    const params = {
      TableName: MEMBER_ORG_TABLE,
      Key: { id },
      UpdateExpression: 'set #status = :status, updated_at = :updated_at',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':status': status,
        ':updated_at': new Date().toISOString(),
      },
      ConditionExpression: 'attribute_exists(id)',
      ReturnValues: 'ALL_NEW',
    }

    const result = await ddbDocClient.send(new UpdateCommand(params))

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Status updated', updatedMember: result.Attributes }),
    }

  } catch (error) {

    if (error.name === 'ConditionalCheckFailedException') {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Member organization record not found' }),
      }
    }

    console.error(error)

    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    }

  }

}
