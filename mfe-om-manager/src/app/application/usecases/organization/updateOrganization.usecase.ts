import { INotificationResponse } from "../../dto/notification.dto"
import { OrganizationApiService } from "../../../infrastructure/services/organization.service"

export interface IUpdateOrganizationDTO {
	id: string
	name: string
}

export class UpdateOrganizationUseCase {

	constructor(private organizationApiService: OrganizationApiService) {}

	async execute(data: IUpdateOrganizationDTO): Promise<INotificationResponse> {
		return this.organizationApiService.updateOrganization(data)
	}

}