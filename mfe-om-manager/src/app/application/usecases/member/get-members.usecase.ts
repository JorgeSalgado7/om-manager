import { INotificationResponse } from "../../dto/notification.dto"
import { MemberApiService } from "../../../infrastructure/services/member.service"

export class GetMembersUseCase {

	constructor(private memberApiService: MemberApiService) {}

	async execute(): Promise<INotificationResponse> {
		return this.memberApiService.getMembers()
	}

}