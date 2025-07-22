import { Component, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { Router, ActivatedRoute } from '@angular/router'

import { CardModule } from 'primeng/card'
import { MessageModule } from 'primeng/message'

import { EmailInput } from '../../../components/inputs/email-input/email-input'
import { CodeInput } from '../../../components/inputs/code-input/code-input'
import { Button } from '../../../components/button/button'
import { LoadingModal } from '../../../components/modals/loading-modal/loading-modal'

import { AwsAuthService } from '../../../../infrastructure/aws/aws-auth-service'
import { en } from '../../../locales/en'

@Component({
  selector: 'app-confirm-signup',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    MessageModule,

    EmailInput,
    CodeInput,
    Button,
    LoadingModal,
  ],
  templateUrl: './confirm.html',
  styleUrl: './confirm.scss',
})
export class ConfirmSignup {

  private awsAuthService = inject(AwsAuthService)
  private router = inject(Router)
  private activatedRoute = inject(ActivatedRoute)

  title = en.confirmSignup.title

  emailLabel = en.confirmSignup.emailInput.label
  emailPlaceholder = en.confirmSignup.emailInput.placeholder
  emailErrorMessage = en.confirmSignup.emailErrorMessage

  codeLabel = en.confirmSignup.codeInput.label
  codePlaceholder = en.confirmSignup.codeInput.placeholder
  codeErrorMessage = en.confirmSignup.codeErrorMessage

  confirmButtonText = en.confirmSignup.confirmButton

  email: string = ''
  code: string = ''

  emailError = false
  codeError = false

  errorMessage = ''
  showError = false

  isLoading = false

  constructor() {
    this.activatedRoute.queryParams.subscribe(params => {
      this.email = params['email'] || ''
    })
  }

  async confirm() {
    this.emailError = false
    this.codeError = false
    this.showError = false
    this.isLoading = true

    try {
      if (!this.email) {
        this.emailError = true
        throw new Error(this.emailErrorMessage)
      }
      if (!this.code) {
        this.codeError = true
        throw new Error(this.codeErrorMessage)
      }

      const response = await this.awsAuthService.confirmSignup(this.email, this.code)

      if (response.notification.error) {
        this.showError = true
        this.errorMessage = response.notification.message || ''
      } else {
        await this.router.navigate(['/'])
      }
    } catch (error: any) {
      this.showError = true
      this.errorMessage = error.message || 'Error desconocido'
    } finally {
      this.isLoading = false
    }
  }
}
