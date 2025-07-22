import { API_CONFIG } from "../../../environments/api.config"

import { IGetOrganizationsByMemberEmailDTO } from "../../application/usecases/organization/getOrganizationsByMemberEmail.usecase"
import { ICreateOrganizationDTO } from "../../application/usecases/organization/createOrganization.usecase"
import { IUpdateOrganizationDTO } from "../../application/usecases/organization/updateOrganization.usecase"
import { IDeleteOrganizationDTO } from "../../application/usecases/organization/deleteOrganization.usecase"

import { INotificationResponse } from "../../application/dto/notification.dto"

export class OrganizationApiService {

	private readonly baseUrl = `${API_CONFIG.BASE_URL}`

	async getOrganizationsByMemberEmail(data: IGetOrganizationsByMemberEmailDTO): Promise<INotificationResponse> {

		const response = await fetch(`${this.baseUrl}${API_CONFIG.ENDPOINTS.GET_ORG_BY_MEMBER_EMAIL}`, {
			method: 'POST',
			headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
		})

		return response.json()

	}

	async createOrganization(data: ICreateOrganizationDTO): Promise<INotificationResponse> {

		const response = await fetch(`${this.baseUrl}${API_CONFIG.ENDPOINTS.CREATE_ORG}`, {
			method: 'POST',
			headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
		})

		return response.json()

	}

	async updateOrganization(data: IUpdateOrganizationDTO): Promise<INotificationResponse> {

		const response = await fetch(`${this.baseUrl}${API_CONFIG.ENDPOINTS.UPDATE_ORG}`, {
			method: 'PUT',
			headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
		})

		return response.json()

	}

	async deleteOrganization(data: IDeleteOrganizationDTO): Promise<INotificationResponse> {

		const response = await fetch(`${this.baseUrl}${API_CONFIG.ENDPOINTS.DELETE_ORG}`, {
			method: 'DELETE',
			headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
		})

		return response.json()

	}

}