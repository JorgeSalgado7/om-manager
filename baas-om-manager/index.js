import { createMember } from './member/createMember'
import { updateMemberRole } from './member/updateMemberRole'
import { getAllMembers } from './member/getAllMembers'
import { deleteMemberOrg } from './member/deleteMemberOrg'
import { inviteMember } from './member/inviteMember'
import { updateMemberStatus } from './member/updateMemberStatus'
import { getMemberOrganizations } from './member/getMemberOrganizations'

import { createOrganization } from './organization/createOrganization'
import { updateOrganization } from './organization/updateOrganization'
import { deleteOrganization } from './organization/deleteOrganization'

export const handler = async (event) => {
  
  const { httpMethod, path } = event

  if (httpMethod === 'POST' && path === '/members') {
    return createMember(event)
  }

  if (httpMethod === 'PATCH' && path === '/members/role') {
    return updateMemberRole(event)
  }

  if (httpMethod === 'GET' && path === '/members') {
    return getAllMembers(event)
  }

  if (httpMethod === 'DELETE' && path === '/member-org') {
    return deleteMemberOrg(event)
  }

  if (httpMethod === 'POST' && path === '/members/invite') {
    return inviteMember(event)
  }

  if (httpMethod === 'PATCH' && path === '/members/status') {
    return updateMemberStatus(event)
  }

  if (httpMethod === 'GET' && path === '/members/organizations') {
    return getMemberOrganizations(event)
  }

  if (httpMethod === 'POST' && path === '/organizations') {
    return createOrganization(event)
  }

  if (httpMethod === 'PATCH' && path === '/organizations') {
    return updateOrganization(event)
  }

  if (httpMethod === 'DELETE' && path === '/organizations') {
    return deleteOrganization(event)
  }

  return {
    statusCode: 404,
    body: JSON.stringify({ error: 'Route not found' }),
  }
}
