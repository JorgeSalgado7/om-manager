import { CreateMemberDTO } from "../../application/dto/member.dto"
import { CreateMemberResponse } from "../../application/dto/member.response"
import { API_CONFIG } from "../../../environments/api.config"

export class MemberApiService {

  private readonly baseUrl = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CREATE_MEMBER}`

  async createMember(data: CreateMemberDTO): Promise<CreateMemberResponse> {

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      const errorBody = await response.json()
      throw new Error(errorBody.error || 'Error creando miembro')
    }

    return response.json()
		
  }

}