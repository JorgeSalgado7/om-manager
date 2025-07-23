import { INotificationResponse } from "../../dto/notification.dto"
import { OrganizationApiService } from "../../../infrastructure/services/organization.service"

export class GetOrganizations {

	constructor(private organizationApiService: OrganizationApiService) {}

	async execute(): Promise<INotificationResponse> {
		return this.organizationApiService.getOrganizations()
	}

}