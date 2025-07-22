import { CreateMemberDTO } from "../../application/dto/member.dto"
import { CreateMemberResponse } from "../../application/dto/member.response"
import { API_CONFIG } from "../../../environments/api.config"
import { INotificationResponse } from "../../application/dto/notification.dto"

import { IInviteMemberDTO } from "../../application/usecases/member/invite-member.usecase"
import { IUpdateMemberRoleDTO } from "../../application/usecases/member/update-member-role.usecase"
import { IDeleteMemberFromOrgDTO } from "../../application/usecases/member/delete-member-from-org.usecase"

export class MemberApiService {

  private readonly baseUrl = `${API_CONFIG.BASE_URL}`

  async createMember(data: CreateMemberDTO): Promise<CreateMemberResponse> {

    const response = await fetch(`${this.baseUrl}${API_CONFIG.ENDPOINTS.CREATE_MEMBER}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })

    return response.json()
		
  }

	async getMembers(): Promise<INotificationResponse> {

    const response = await fetch(`${this.baseUrl}${API_CONFIG.ENDPOINTS.GET_MEMBERS}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
    })

    return response.json()
		
  }

	async inviteMember(data: IInviteMemberDTO): Promise<INotificationResponse> {

    const response = await fetch(`${this.baseUrl}${API_CONFIG.ENDPOINTS.INVITE_MEMBER}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })

    return response.json()
		
  }

	async updateMemberRole(data: IUpdateMemberRoleDTO): Promise<INotificationResponse> {

    const response = await fetch(`${this.baseUrl}${API_CONFIG.ENDPOINTS.UPDATE_MEMBER_ROLE}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })

    return response.json()
		
  }

	async deleteMemberFromOrg(data: IDeleteMemberFromOrgDTO): Promise<INotificationResponse> {

    const response = await fetch(`${this.baseUrl}${API_CONFIG.ENDPOINTS.DELETE_MEMBER_FROM_ORG}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })

    return response.json()
		
  }

}