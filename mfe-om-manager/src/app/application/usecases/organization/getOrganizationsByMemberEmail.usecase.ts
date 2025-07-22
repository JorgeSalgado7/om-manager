import { INotificationResponse } from "../../dto/notification.dto"
import { OrganizationApiService } from "../../../infrastructure/services/organization.service"

export interface IGetOrganizationsByMemberEmailDTO {
	email: string
}

export class GetOrganizationsByMemberEmail {

	constructor(private organizationApiService: OrganizationApiService) {}

	async execute(data: IGetOrganizationsByMemberEmailDTO): Promise<INotificationResponse> {
		return this.organizationApiService.getOrganizationsByMemberEmail(data)
	}

}