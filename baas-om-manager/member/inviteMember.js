import {
  DynamoDBClient,
  ScanCommand
} from "@aws-sdk/client-dynamodb"
import {
  DynamoDBDocumentClient,
  PutCommand,
} from "@aws-sdk/lib-dynamodb"
import { v4 as uuidv4 } from "uuid"
import { notificationResponse } from "../utils/notificationResponse.js"
import nodemailer from "nodemailer"

const MEMBERS_TABLE = process.env.MEMBER_TABLE_NAME
const MEMBER_ORG_TABLE = process.env.MEMBER_ORGANIZATION_TABLE_NAME
const EMAIL_USER = process.env.EMAIL_USER
const EMAIL_PASS = process.env.EMAIL_PASS

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
})

export const inviteMember = async (event, headers) => {

  try {

		const client = new DynamoDBClient({})
		const ddbDocClient = DynamoDBDocumentClient.from(client)

    const body = JSON.parse(event.body || '{}')
    const { email, id_organization, invited_by } = body

    if (!email || !id_organization || !invited_by) {
      return {
        statusCode: 400,
        headers,
        body: notificationResponse(null, true, "email, id_organization and invited_by are required"),
      }
    }

    const now = new Date().toISOString()


    const emailSearch = await ddbDocClient.send(new ScanCommand({
			TableName: MEMBERS_TABLE,
			FilterExpression: "#email = :email",
			ExpressionAttributeNames: {
				"#email": "email",
			},
			ExpressionAttributeValues: {
				":email": { S: email },
			},
			Limit: 1,
		}));

    let memberId
    let isNewMember = false

    if (emailSearch.Items && emailSearch.Items.length > 0) {

      memberId = emailSearch.Items[0].id
    } else {
 
      memberId = uuidv4()
      isNewMember = true

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
        ConditionExpression: "attribute_not_exists(id)",
      }))
    }

    const memberOrgId = uuidv4()

    const memberOrgItem = {
      id: memberOrgId,
      id_member: memberId,
      id_organization,
      role: "member",
      created_at: now,
      updated_at: now,
    }

    await ddbDocClient.send(new PutCommand({
      TableName: MEMBER_ORG_TABLE,
      Item: memberOrgItem,
      ConditionExpression: "attribute_not_exists(id)",
    }))

    await transporter.sendMail({
      from: `"Mi App" <${EMAIL_USER}>`,
      to: email,
      subject: "Invitación a organización",
      text: `
        Has sido invitado a la organización con ID ${id_organization}.\n
        Crea una cuenta en OM Manager con tu correo y explora nuestras novedades.
      `,
    })

    return {
      statusCode: 201,
      headers,
      body: notificationResponse(
        { id: memberId },
        false,
        isNewMember
          ? "Invitation sent to new member"
          : "Invitation sent to existing member"
      ),
    }

  } catch (error) {
    if (error.name === 'ConditionalCheckFailedException') {
      return {
        statusCode: 409,
        headers,
        body: notificationResponse(null, true, "Member already added to this organization"),
      }
    }

    console.error("Error in inviteMember:", error)

    return {
      statusCode: 500,
      headers,
      body: notificationResponse(null, true, "Internal Server Error"),
    }
  }
}
