import { MemberApiService } from "../../../infrastructure/services/member.service"
import { CreateMemberDTO } from "../../dto/member.dto"
import { CreateMemberResponse } from "../../dto/member.response"

export class CreateMemberUseCase {

  constructor(private memberApiService: MemberApiService) {}

  async execute(data: CreateMemberDTO): Promise<CreateMemberResponse> {
    return this.memberApiService.createMember(data)
  }
	
}