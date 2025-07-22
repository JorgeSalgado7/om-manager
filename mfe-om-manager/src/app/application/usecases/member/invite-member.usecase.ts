import { INotificationResponse } from "../../dto/notification.dto"
import { MemberApiService } from "../../../infrastructure/services/member.service"

export interface IInviteMemberDTO {
	email: string
	id_organization: string
	invited_by: string
}

export class InviteMembersUseCase {

	constructor(private memberApiService: MemberApiService) {}

	async execute(data: IInviteMemberDTO): Promise<INotificationResponse> {
		return this.memberApiService.inviteMember(data)
	}

}