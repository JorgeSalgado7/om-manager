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
  selector: 'app-new-password',
  imports: [
		CommonModule,

		CardModule,
		MessageModule,
		
		EmailInput,
		PasswordInput,
		Button,
		LoadingModal,
	],
  templateUrl: './new-password.html',
  styleUrl: '../login/login.scss'
})
export class NewPassword {

	private awsAuthService = inject(AwsAuthService)
	private router = inject(Router)

	title: string = en.login.newPassword.title

	emailLabel: string = en.login.newPassword.confirmEmailLabel
	emailPlaceholder: string = en.login.emailInput.placeholder
	email: string = 'jorge.salgadoh@outlook.com'
	emailError: boolean = false
	emailErrorMessage: string = ''

	passwordLabel: string = en.login.newPassword.newPasswordLabel
	passwordPlaceholder: string = en.login.passwordInput.placeholder
	password: string = 'SOYsoloyo123_'
	passwordError: boolean = false
	passwordErrorMessage: string = ''
	isSignUp: boolean = true

	confirmPasswordLabel: string = en.login.newPassword.confirmNewPasswordLabel
	confirmPasswordPlaceholder: string = en.login.passwordInput.placeholder
	confirmPassword: string = 'SOYsoloyo123_'
	confirmPasswordError: boolean = false
	confirmPasswordErrorMessage: string = ''
	confirmIsSignUp: boolean = false

	loginButton: string = en.login.loginButton
	changePasswordButton: string = en.login.newPassword.changePasswordButton

	signinError: boolean = false
	signinErrorMessage: string = ''

	isLoading: boolean = false

	async signin(){

		this.emailError = false
		this.passwordError = false
		this.isLoading = true

		try {
			
			const response = await this.awsAuthService.changePassword(this.email, this.password, this.confirmPassword)
			
			if(response.data !== null && !response.notification.error){
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
