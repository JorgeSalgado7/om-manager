import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb"
import { v4 as uuidv4 } from "uuid"
import { notificationResponse } from "../utils/notificationResponse.js"



const MEMBERS_TABLE = process.env.MEMBER_TABLE_NAME

export const createMember = async (event, headers) => {

	try {

		const client = new DynamoDBClient({})
		const ddbDocClient = DynamoDBDocumentClient.from(client)

    const body = JSON.parse(event.body || '{}')
    const { email } = body

    if (!email) {

      return {
        statusCode: 400,
				headers,
        body: notificationResponse(null, true, 'Email required'),
      }

    }

    const memberItem = {
      id: uuidv4(),
      email,
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    await ddbDocClient.send(new PutCommand({
      TableName: MEMBERS_TABLE,
      Item: memberItem,
      ConditionExpression: 'attribute_not_exists(email)',
    }))

    return {
      statusCode: 201,
			headers,
      body: notificationResponse(memberItem, false, null),
    }

  } 
	catch (error) {

    if (error.name === 'ConditionalCheckFailedException') {
      return {
        statusCode: 409,
				headers,
        body: notificationResponse(null, true, "Member with this email already exists")
      }
    }


    return {
      statusCode: 500,
			headers,
      body: notificationResponse(null, true, "Internal Server Error")
    }

  }

}
