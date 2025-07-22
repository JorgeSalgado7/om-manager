import { Component, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { Router } from '@angular/router'

// PrimeNG
import { CardModule } from 'primeng/card'
import { MessageModule } from 'primeng/message'

// Componentes
import { EmailInput } from '../../components/inputs/email-input/email-input'
import { PasswordInput } from '../../components/inputs/password-input/password-input'
import { Button } from '../../components/button/button'
import { LoadingModal } from '../../components/modals/loading-modal/loading-modal'

// Infraestructure
import { AwsAuthService } from '../../../infrastructure/aws/aws-auth-service'
import { MemberApiService } from '../../../infrastructure/services/member.service'

// Application
import { CreateMemberUseCase } from '../../../application/usecases/member/create-member.use-case'

// Locales
import { en } from '../../locales/en'

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [
    CommonModule,

    CardModule,
    MessageModule,

    EmailInput,
    PasswordInput,
    Button,
    LoadingModal,
  ],
  templateUrl: './signup.html',
  styleUrl: './signup.scss',
})
export class Signup {

	private awsAuthService = inject(AwsAuthService)
	private router = inject(Router)
	private createMemberUseCase: CreateMemberUseCase

  constructor() {
    const memberApiService = new MemberApiService()
    this.createMemberUseCase = new CreateMemberUseCase(memberApiService)
  }

	title: string = en.signup.title

	emailLabel: string = en.signup.emailInput.label
	emailPlaceholder: string = en.signup.emailInput.placeholder
	email: string = ''
	emailError: boolean = false
	emailErrorMessage: string = ''

	passwordLabel: string = en.signup.passwordInput.label
	passwordPlaceholder: string = en.signup.passwordInput.placeholder
	password: string = ''
	passwordError: boolean = false
	passwordErrorMessage: string = ''
	isSignUp: boolean = true

	signupButton: string = en.signup.signupButton

	signupError: boolean = false
	signupErrorMessage: string = ''

	isLoading: boolean = false

	async signup() {

		this.emailError = false
		this.passwordError = false
		this.signupError = false
		this.isLoading = true
		this.signupErrorMessage = ''

		try {
			
			const response = await this.awsAuthService.signup(this.email, this.password);

			if (response.notification.error) {

				try {

					await this.createMemberUseCase.execute({ email: this.email })
					
					if (response.notification.message === 'CONFIRM_SIGN_UP') {
						await this.router.navigate(['/signup/confirm'], { queryParams: { email: this.email } })
					} 
					else {
						
						this.signupError = true;
						this.signupErrorMessage = response.notification.message || ''
					}


				} 
				catch (err) {
					this.signupError = true
					this.signupErrorMessage = (err as Error).message
				}


				
			} 
			else {
				await this.router.navigate(['/dashboard'])
			}


		} 
		catch (err: any) {
			this.signupError = true
			this.signupErrorMessage = en.signup.signupErrorMessage
		} 
		finally {
			this.isLoading = false
		}
		
	}

}
