import { INotificationResponse } from "../../dto/notification.dto"
import { MemberApiService } from "../../../infrastructure/services/member.service"

export interface IUpdateMemberRoleDTO {
	id_member_org: string
	role: string
}

export class UpdateMemberRoleUseCase {

	constructor(private memberApiService: MemberApiService) {}

	async execute(data: IUpdateMemberRoleDTO): Promise<INotificationResponse> {
		return this.memberApiService.updateMemberRole(data)
	}

}