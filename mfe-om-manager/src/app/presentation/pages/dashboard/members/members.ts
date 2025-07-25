import { Component } from '@angular/core'
import { CommonModule } from '@angular/common'
import { EmailInput } from '../../../components/inputs/email-input/email-input'
import { Button } from '../../../components/button/button'
import { TableModule } from 'primeng/table'
import { CardModule } from 'primeng/card'
import { SelectModule } from 'primeng/select'
import { FormsModule } from '@angular/forms'
import { LoadingModal } from '../../../components/modals/loading-modal/loading-modal'
import { MessageModule } from 'primeng/message'

import { en } from '../../../locales/en'

import { MemberApiService } from '../../../../infrastructure/services/member.service'
import { OrganizationApiService } from '../../../../infrastructure/services/organization.service'

import { GetMembersUseCase } from '../../../../application/usecases/member/get-members.usecase'
import { UpdateMemberRoleUseCase } from '../../../../application/usecases/member/update-member-role.usecase'
import { DeleteMemberFromOrgUseCase } from '../../../../application/usecases/member/delete-member-from-org.usecase'
import { GetOrganizations } from '../../../../application/usecases/organization/getOrganizations.usecase'
import { InviteMembersUseCase } from '../../../../application/usecases/member/invite-member.usecase'


@Component({
  selector: 'app-members',
  imports: [
		EmailInput,
		Button,
		TableModule,
		CardModule,
		CommonModule,
		SelectModule,
		FormsModule,
		LoadingModal,
		MessageModule,
	],
  templateUrl: './members.html',
  styleUrl: './members.scss'
})
export class Members {

	private getMembersUseCase: GetMembersUseCase
	private updateMemberRoleUseCase: UpdateMemberRoleUseCase
	private deleteMemberFromOrgUseCase: DeleteMemberFromOrgUseCase
	private inviteMembersUseCase: InviteMembersUseCase

	private getOrganizationsUseCase: GetOrganizations

	constructor(){
		const memberApiService = new MemberApiService()
		this.getMembersUseCase = new GetMembersUseCase(memberApiService)
		this.updateMemberRoleUseCase = new UpdateMemberRoleUseCase(memberApiService)
		this.deleteMemberFromOrgUseCase = new DeleteMemberFromOrgUseCase(memberApiService)
		this.inviteMembersUseCase = new InviteMembersUseCase(memberApiService)

		const organizationApiService = new OrganizationApiService()
		this.getOrganizationsUseCase = new GetOrganizations(organizationApiService)

	}

	title: string = en.member.title
	members: any = null

	email: string = ''
	emailLabel: string = en.member.invitation.email.label
	emailPlaceholder: string = en.member.invitation.email.placeholder
	emailError: boolean = false
	emailErrorMessage: string = ''

	organizationLabel: string = en.member.invitation.organization.label
	sendInvitation: string = en.member.invitation.sendInvitation

	loading: boolean = false

	roles: any = [
		{ label: 'owner', value:'owner' },
		{ label: 'admin', value:'admin' },
		{ label: 'member', value:'member' },
	]

	organizations: any = null
	selectedOrg: string = ''
	invited: boolean = false

	async getMembers(){

		this.loading = true

		try {
			
			const { data } = await this.getMembersUseCase.execute()

			if(data !== null){
				this.members = data
			}

		} 
		catch (error) {
			console.log(error)
		}
		finally {
			this.loading = false
		}

	}

	async getOrgs(){

		this.loading = true

		try {
			
			const { data } = await this.getOrganizationsUseCase.execute()

			if(data !== null){
				
				let orgs = []

				for (let i = 0; i < data.length; i++) {
					orgs.push({ label: data[i].name, value: data[i].id });
				}

				this.organizations = orgs

			}

			console.log(this.organizations)

		} 
		catch (error) {
			console.log(error)
		}
		finally {
			this.loading = false
		}

	}

	ngOnInit(){
		this.getMembers()
		this.getOrgs()
	}

	async updateRole(id: string, role: string){

		this.loading = true

		try {
			
			const { notification } = await this.updateMemberRoleUseCase.execute({ id_member_org: id, role })

			if(!notification.error){
				this.getMembers()
			}

		} 
		catch (error) {
			console.log(error)
		}
		finally {
			this.loading = false
		}

	}

	async delete(id: string){

		this.loading = true

		try {
			
			const { notification } = await this.deleteMemberFromOrgUseCase.execute({ id_member_org: id })

			if(!notification.error){
				this.getMembers()
			}

		} 
		catch (error) {
			console.log(error)
		}
		finally {
			this.loading = false
		}

	}

	async inviteMember(email: string, id_org: string){

		this.loading = true

		try {
			
			const { notification } = await this.inviteMembersUseCase.execute({ email: email, id_organization: id_org, invited_by: localStorage.getItem('om_email') || '' })

			if(!notification.error){
				this.invited = true
				this.getMembers()
			}

		} 
		catch (error) {
			console.log(error)
		}
		finally {
			this.loading = false
		}

	}

}
