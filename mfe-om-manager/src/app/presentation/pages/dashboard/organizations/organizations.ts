import { Component} from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { InputTextModule } from 'primeng/inputtext'
import { CardModule } from 'primeng/card'
import { LoadingModal } from '../../../components/modals/loading-modal/loading-modal'
import { TableModule } from 'primeng/table'
import { RouterModule } from '@angular/router'

import { en } from '../../../locales/en'

import { OrganizationApiService } from '../../../../infrastructure/services/organization.service'

import { GetOrganizationsByMemberEmail } from '../../../../application/usecases/organization/getOrganizationsByMemberEmail.usecase'
import { UpdateOrganizationUseCase } from '../../../../application/usecases/organization/updateOrganization.usecase'
import { DeleteOrganizationUseCase } from '../../../../application/usecases/organization/deleteOrganization.usecase'

@Component({
  selector: 'app-organizations',
  imports: [
		CardModule,
		CommonModule,
		FormsModule,
		InputTextModule,
		LoadingModal,
		TableModule,
		RouterModule,
	],
  templateUrl: './organizations.html',
  styleUrl: './organizations.scss'
})
export class Organizations {

	private getOrganizationsByMemberEmail: GetOrganizationsByMemberEmail
	private updateOrganization: UpdateOrganizationUseCase
	private deleteOrganizationUseCase: DeleteOrganizationUseCase

	constructor(){
		const organizationApiService = new OrganizationApiService()
		this.getOrganizationsByMemberEmail = new GetOrganizationsByMemberEmail(organizationApiService)
		this.updateOrganization = new UpdateOrganizationUseCase(organizationApiService)
		this.deleteOrganizationUseCase = new DeleteOrganizationUseCase(organizationApiService)
	}

	title: string = en.organization.title
	createOrgText = en.organization.create.title
	organizations: any = null
	loading: boolean = false

	async getOrgs(){
		
		this.loading = true

		try {
		
			const { data } = await this.getOrganizationsByMemberEmail.execute({ email: localStorage.getItem('om_email') || '' })

			if(data !== null){
				this.organizations = data
			}

		} 
		catch (error) {
			console.log(error)
		}

		finally {
			this.loading = false
		}

	}

	async updateOrg(id: string, name: string){

		this.loading = true

		try {
		
			const { notification } = await this.updateOrganization.execute({ id, name })

			if(!notification.error){
				this.getOrgs()
			}

		} 
		catch (error) {
			
			console.log(error)

		}

		finally {
			this.loading = false
		}

	}

	async deleteOrg(id: string){

		this.loading = true

		try {
		
			const { notification } = await this.deleteOrganizationUseCase.execute({ id })

			if(!notification.error){
				this.getOrgs()
			}

		} 
		catch (error) {
			console.log(error)
		}

		finally {
			this.loading = false
		}

	}

	ngOnInit(): void {
		this.getOrgs()
	}

}
