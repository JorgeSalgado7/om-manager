import { createMember } from './member/createMember.js'
// import { updateMemberRole } from './member/updateMemberRole'
// import { getAllMembers } from './member/getAllMembers'
// import { deleteMemberOrg } from './member/deleteMemberOrg'
// import { inviteMember } from './member/inviteMember'
// import { updateMemberStatus } from './member/updateMemberStatus'

import { getOrganizationsByEmail } from './organization/getOrganizations.js'
import { createOrganization } from './organization/createOrganization.js'
import { updateOrganization } from './organization/updateOrganization.js'
import { deleteOrganization } from './organization/deleteOrganization.js'

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

  // Members
  if (httpMethod === 'POST' && path === '/baas-om-manager/members/create') {
    return await createMember(event, headers)
  }

	// Organizations
  if (httpMethod === 'POST' && path === '/baas-om-manager/organizations/get-by-member-email') {
    return await getOrganizationsByEmail(event, headers)
  }
  
  if (httpMethod === 'POST' && path === '/baas-om-manager/organizations/create') {
    return await createOrganization(event, headers)
  }

  if (httpMethod === 'PUT' && path === '/baas-om-manager/organizations/update') {
    return await updateOrganization(event, headers)
  }

  if (httpMethod === 'DELETE' && path === '/baas-om-manager/organizations/delete') {
    return await deleteOrganization(event, headers)
  }

  return {
    statusCode: 404,
    headers,
    body: JSON.stringify({ error: 'Route not found' }),
  }
}
