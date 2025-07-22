import { INotificationResponse } from "../../dto/notification.dto"
import { OrganizationApiService } from "../../../infrastructure/services/organization.service"

export interface IDeleteOrganizationDTO {
	id: string
}

export class DeleteOrganizationUseCase {

	constructor(private organizationApiService: OrganizationApiService) {}

	async execute(data: IDeleteOrganizationDTO): Promise<INotificationResponse> {
		return this.organizationApiService.deleteOrganization(data)
	}

}