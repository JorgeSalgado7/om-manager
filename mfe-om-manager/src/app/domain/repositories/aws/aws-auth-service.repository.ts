import { IAWSLoginResponseDTO } from '../../../application/dto/aws-login.dto'

export interface AWSAuthServiceRespository {
  login(email: string, password: string): Promise<IAWSLoginResponseDTO>
	changePassword(email: string, password: string, newPassword: string): Promise<IAWSLoginResponseDTO>
  logout(): Promise<void>
	signup(email: string, password: string): Promise<IAWSLoginResponseDTO>
	confirmSignup(email: string, confirmationCode: string): Promise<IAWSLoginResponseDTO>

}
