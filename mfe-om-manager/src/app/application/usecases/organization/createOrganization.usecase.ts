import { INotificationResponse } from "../../dto/notification.dto"
import { OrganizationApiService } from "../../../infrastructure/services/organization.service"

export interface ICreateOrganizationDTO {
	name: string
	email: string
}

export class CreateOrganizationUseCase {

	constructor(private organizationApiService: OrganizationApiService) {}

	async execute(data: ICreateOrganizationDTO): Promise<INotificationResponse> {
		return this.organizationApiService.createOrganization(data)
	}

}