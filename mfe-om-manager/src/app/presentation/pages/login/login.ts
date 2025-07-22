// Angular
import { Component, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { Router } from '@angular/router'

//Prime NG
import { CardModule } from 'primeng/card'
import { MessageModule } from 'primeng/message'

//Components
import { EmailInput } from '../../components/inputs/email-input/email-input'
import { PasswordInput } from '../../components/inputs/password-input/password-input'
import { Button } from '../../components/button/button'
import { LoadingModal } from '../../components/modals/loading-modal/loading-modal'

// Infra
import { AwsAuthService } from '../../../infrastructure/aws/aws-auth-service'

//Locales
import { en } from '../../locales/en'

@Component({
  selector: 'app-login',
  imports: [
		CommonModule,

		CardModule,
		MessageModule,
		
		EmailInput,
		PasswordInput,
		Button,
		LoadingModal,
	],
  templateUrl: './login.html',
  styleUrl: './login.scss',
	standalone: true
})
export class Login {

	private awsAuthService = inject(AwsAuthService)
	private router = inject(Router)

	title: string = en.login.title

	emailLabel: string = en.login.emailInput.label
	emailPlaceholder: string = en.login.emailInput.placeholder
	email: string = 'jorge.salgadoh@outlook.com'
	emailError: boolean = false
	emailErrorMessage: string = ''

	passwordLabel: string = en.login.passwordInput.label
	passwordPlaceholder: string = en.login.passwordInput.placeholder
	password: string = 'SOYsoloyo123_'
	passwordError: boolean = false
	passwordErrorMessage: string = ''
	isSignUp: boolean = false

	loginButton: string = en.login.loginButton

	signinError: boolean = false
	signinErrorMessage: string = ''

	isLoading: boolean = false

	async signin(){

		this.emailError = false
		this.passwordError = false
		this.isLoading = true

		try {
			
			const response = await this.awsAuthService.login(this.email, this.password)
			
			if(response.notification.error && response.notification.message === en.login.awsStepsConstants.changePassword){
				await this.router.navigate(['/login/new-password'])
			}

			else if(response.data !== null && !response.notification.error){
				await this.router.navigate(['/dashboard'])
			}

		} 
		catch (error: any) {
			console.log(error)
			console.log('error')
			this.emailError = true
			this.passwordError = true
			this.signinError = true
			this.signinErrorMessage = en.login.signinErrorMessage
		}
		finally {
			this.isLoading = false
		}

	}

}
