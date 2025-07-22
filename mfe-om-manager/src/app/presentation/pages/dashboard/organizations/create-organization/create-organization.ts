import { Component } from '@angular/core'
import { CardModule } from 'primeng/card'
import { TextInput } from '../../../../components/inputs/text-input/text-input'
import { Button } from '../../../../components/button/button'
import { en } from '../../../../locales/en'

@Component({
  selector: 'app-create-organization',
  imports: [
		CardModule,
		TextInput,
		Button,
	],
  templateUrl: './create-organization.html',
  styleUrl: './create-organization.scss'
})
export class CreateOrganization {

	title: string = en.organization.create.title
	name: string = ''
	nameError: boolean = false
	nameErrorMessage: string = ''
	label: string = en.organization.create.inputs.name.label
	placeholder: string = en.organization.create.inputs.name.placeholder
	createButton: string = en.organization.create.button

	//recuperar email de local storage "om_email" ya es un string
	//el endpoint a atacar es 

}
