import { Component } from '@angular/core'
import { CardModule } from 'primeng/card'
import { TextInput } from '../../../../components/inputs/text-input/text-input'
import { Button } from '../../../../components/button/button'
import { en } from '../../../../locales/en'

@Component({
  selector: 'app-update-organization',
  imports: [
		CardModule,
		TextInput,
		Button,
	],
  templateUrl: './update-organization.html',
  styleUrl: './update-organization.scss'
})
export class UpdateOrganization {

	title: string = en.organization.update.title
	name: string = ''
	nameError: boolean = false
	nameErrorMessage: string = ''
	label: string = en.organization.update.inputs.name.label
	placeholder: string = en.organization.update.inputs.name.placeholder
	updateButton: string = en.organization.update.button
	deleteButton: string = en.organization.update.deleteButton

}
