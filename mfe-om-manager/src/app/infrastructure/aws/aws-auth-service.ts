import { Injectable } from '@angular/core'
import { signIn, confirmSignIn, signOut, getCurrentUser, fetchAuthSession, signUp, confirmSignUp  } from 'aws-amplify/auth'

import { AWSAuthServiceRespository } from '../../domain/repositories/aws/aws-auth-service.repository'
import { AWSLoginResponseDTO, IAWSLoginResponseDTO } from '../../application/dto/aws-login.dto'

import { SessionService } from '../services/session.service'

@Injectable({ providedIn: 'root' })
export class AwsAuthService implements AWSAuthServiceRespository {

	constructor(private sessionService: SessionService) {}

  async login(email: string, password: string): Promise<IAWSLoginResponseDTO> {

    const currentUser = await getCurrentUser().catch(() => null)

    if (currentUser) {
      await this.logout()
    }

    const response = await signIn({ username: email, password })

    if (response.isSignedIn === false) {
      return AWSLoginResponseDTO(null, true, response.nextStep.signInStep)
    }

    const tokens = await this.getSessionTokens()

		if (tokens) {
			this.sessionService.setTokens(tokens)
		}

    return AWSLoginResponseDTO(tokens, false, null)

  }

  async changePassword(email: string, password: string, newPassword: string): Promise<IAWSLoginResponseDTO> {

    const STEP_NEW_PASSWORD = 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED'

    const signInResponse = await signIn({ username: email, password })

    if (
      signInResponse.isSignedIn === false &&
      signInResponse.nextStep.signInStep === STEP_NEW_PASSWORD
    ) {
      const confirmResponse = await confirmSignIn({ challengeResponse: newPassword })

      if (confirmResponse.isSignedIn) {
        const tokens = await this.getSessionTokens()
        return AWSLoginResponseDTO(tokens, false, null)
      }

      return AWSLoginResponseDTO(null, true, confirmResponse.nextStep?.signInStep || 'UNKNOWN_STEP')
    }

    if (signInResponse.isSignedIn) {

      const tokens = await this.getSessionTokens()

			if (tokens) {
				this.sessionService.setTokens(tokens)
			}

      return AWSLoginResponseDTO(tokens, false, null)
    }

    return AWSLoginResponseDTO(null, true, signInResponse.nextStep?.signInStep || 'UNKNOWN_STEP')

  }

  private async getSessionTokens(): Promise<any> {

    const session = await fetchAuthSession()

    return {
      idToken: session.tokens?.idToken?.toString() || null,
      accessToken: session.tokens?.accessToken?.toString() || null,
    }

  }

  async logout(): Promise<void> {
    await signOut()
		this.sessionService.clearTokens()
  }

	async signup(email: string, password: string): Promise<IAWSLoginResponseDTO> {

   const response = await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
          },
        },
      })

      return {
        data: null,
        notification: {
          error: true,
          message: response.nextStep.signUpStep,
        },
      }

  }

	async confirmSignup(email: string, code: string): Promise<IAWSLoginResponseDTO> {

		try {
			await confirmSignUp({
				username: email,
				confirmationCode: code
			})
			return AWSLoginResponseDTO(null, false, '')
		} 
		catch (error: any) {
			return AWSLoginResponseDTO(null, true, error.message || 'Error desconocido')
		}

	}


}
