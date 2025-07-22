import { createMember } from './member/createMember.js'
// import { updateMemberRole } from './member/updateMemberRole'
// import { getAllMembers } from './member/getAllMembers'
// import { deleteMemberOrg } from './member/deleteMemberOrg'
// import { inviteMember } from './member/inviteMember'
// import { updateMemberStatus } from './member/updateMemberStatus'
// import { getMemberOrganizations } from './member/getMemberOrganizations'

import { createOrganization } from './organization/createOrganization.js'
// import { updateOrganization } from './organization/updateOrganization'
// import { deleteOrganization } from './organization/deleteOrganization'

export const handler = async (event) => {
  
  const { httpMethod, path } = event

	const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Credentials": true,
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "*"
  }

  if (httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers,
      body: null,
    }
  }

	//Members

  if (httpMethod === 'POST' && path === '/baas-om-manager/members') {
		return await createMember(event, headers)
  }

	//Organization
	if (httpMethod === 'POST' && path === '/baas-om-manager/organization') {
		return await createOrganization(event, headers)
  }

  return {
    statusCode: 404,
		headers,
    body: JSON.stringify({ error: 'Route not found' }),
  }

}
