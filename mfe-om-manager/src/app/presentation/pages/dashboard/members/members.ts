import { Component } from '@angular/core'
import { EmailInput } from '../../../components/inputs/email-input/email-input'
import { Button } from '../../../components/button/button'
import { en } from '../../../locales/en'

@Component({
  selector: 'app-members',
  imports: [
		EmailInput,
		Button,
	],
  templateUrl: './members.html',
  styleUrl: './members.scss'
})
export class Members {

	email: string = ''
	emailLabel: string = en.member.invitation.email.label
	emailPlaceholder: string = en.member.invitation.email.placeholder
	emailError: boolean = false
	emailErrorMessage: string = ''

	organizationLabel: string = en.member.invitation.organization.label

	sendInvitation: string = en.member.invitation.sendInvitation

}
