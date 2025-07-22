import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb"
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses"
import { v4 as uuidv4 } from "uuid"
import { notificationResponse } from "../utils/notificationResponse.js"

const ddbClient = new DynamoDBClient({})
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient)

const sesClient = new SESClient({})

const MEMBERS_TABLE = process.env.MEMBERS_TABLE_NAME
const SES_SENDER_EMAIL = process.env.SES_SENDER_EMAIL

export const inviteMember = async (event, headers) => {

  try {

    const body = JSON.parse(event.body || '{}')
    const { email, id_organization, invited_by } = body

    if (!email || !id_organization || !invited_by) {
      return {
        statusCode: 400,
        headers,
        body: notificationResponse(null, true, "email, id_organization and invited_by are required"),
      }
    }

    const memberId = uuidv4()

    const now = new Date().toISOString()

    const memberItem = {
      id: memberId,
      email,
      id_organization,
      invited_by,
      status: "invited",
      invited_at: now,
      created_at: now,
      updated_at: now,
    }

    await ddbDocClient.send(new PutCommand({
      TableName: MEMBERS_TABLE,
      Item: memberItem,
      ConditionExpression: "attribute_not_exists(email) AND attribute_not_exists(id_organization)",
    }))

    const emailParams = {
      Destination: {
        ToAddresses: [email]
      },
      Message: {
        Body: {
          Text: {
            Data: `Has sido invitado a la organización con ID ${id_organization}. Por favor acepta la invitación.`
          }
        },
        Subject: {
          Data: "Invitación a organización"
        }
      },
      Source: SES_SENDER_EMAIL,
    }

    await sesClient.send(new SendEmailCommand(emailParams))

    return {
      statusCode: 201,
      headers,
      body: notificationResponse(memberItem, false, "Invitation sent"),
    }

  } 
  catch (error) {

    if (error.name === 'ConditionalCheckFailedException') {
      return {
        statusCode: 409,
        headers,
        body: notificationResponse(null, true, "Member already invited or exists in this organization"),
      }
    }

    console.error(error)

    return {
      statusCode: 500,
      headers,
      body: notificationResponse(null, true, "Internal Server Error"),
    }

  }

}
