import { Component, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { CardModule } from 'primeng/card'
import { TextInput } from '../../../../components/inputs/text-input/text-input'
import { Button } from '../../../../components/button/button'
import { en } from '../../../../locales/en'
import { LoadingModal } from '../../../../components/modals/loading-modal/loading-modal'
import { Router } from '@angular/router'
import { MessageModule } from 'primeng/message'

//Infrastructure
import { OrganizationApiService } from '../../../../../infrastructure/services/organization.service'

// Application
import { CreateOrganizationUseCase } from '../../../../../application/usecases/organization/createOrganization.usecase'

@Component({
  selector: 'app-create-organization',
  imports: [
		CommonModule,
		CardModule,
		TextInput,
		Button,
		LoadingModal,
		MessageModule,
	],
  templateUrl: './create-organization.html',
  styleUrl: './create-organization.scss'
})
export class CreateOrganization {

	private createOrganizationUseCase: CreateOrganizationUseCase
	private router = inject(Router)

	constructor(){
		const organizationApiService = new OrganizationApiService()
		this.createOrganizationUseCase = new CreateOrganizationUseCase(organizationApiService)
	}

	title: string = en.organization.create.title
	name: string = ''
	nameError: boolean = false
	nameErrorMessage: string = ''
	label: string = en.organization.create.inputs.name.label
	placeholder: string = en.organization.create.inputs.name.placeholder
	createButton: string = en.organization.create.button

	error: boolean = false
	errorMessage: string = ''

	loading: boolean = false

	async createOrg() {

		this.loading = true
		this.error = false
		this.errorMessage = ''

		try {
			
			const { notification } = await this.createOrganizationUseCase.execute({ name: this.name, email: localStorage.getItem('om_email') || '' })

			if(!notification.error){
				await this.router.navigate(['/organizations'])
			}


		} catch (error) {
			console.log(error)
			this.error = true
			this.errorMessage = typeof error === 'string' ? error : 'Please try again later'
		}
		finally {
			this.loading = false
		}

	}
	

}
