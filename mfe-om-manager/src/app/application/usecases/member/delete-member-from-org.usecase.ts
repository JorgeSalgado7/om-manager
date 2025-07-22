import { INotificationResponse } from "../../dto/notification.dto"
import { MemberApiService } from "../../../infrastructure/services/member.service"

export interface IDeleteMemberFromOrgDTO {
	id_member_org: string
}

export class DeleteMemberFromOrgUseCase {

	constructor(private memberApiService: MemberApiService) {}

	async execute(data: IDeleteMemberFromOrgDTO): Promise<INotificationResponse> {
		return this.memberApiService.deleteMemberFromOrg(data)
	}

}