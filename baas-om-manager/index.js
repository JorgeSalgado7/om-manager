import { createMember } from './member/createMember.js'
import { getMembers } from './member/getMembers.js'
import { inviteMember } from './member/inviteMember.js'
import { updateMemberRole } from './member/updateMemberRole.js'
import { deleteMemberFromOrganization } from './member/deleteMemberFromOrg.js'

import { getAll } from './organization/getAll.js'
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
  if (httpMethod === 'GET' && path === '/baas-om-manager/members') {
    return await getMembers(event, headers)
  }

	if (httpMethod === 'POST' && path === '/baas-om-manager/members/create') {
    return await createMember(event, headers)
  }

	if (httpMethod === 'POST' && path === '/baas-om-manager/members/invite') {
    return await inviteMember(event, headers)
  }
	
	if (httpMethod === 'PUT' && path === '/baas-om-manager/members/update-role') {
    return await updateMemberRole(event, headers)
  }

	if (httpMethod === 'DELETE' && path === '/baas-om-manager/members/delete-from-org') {
    return await deleteMemberFromOrganization(event, headers)
  }



	// Organizations
  if (httpMethod === 'GET' && path === '/baas-om-manager/organizations') {
    return await getAll(event, headers)
  }
	
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
