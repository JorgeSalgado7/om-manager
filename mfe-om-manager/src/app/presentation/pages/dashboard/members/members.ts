import { Component } from '@angular/core'
import { CommonModule } from '@angular/common'
import { EmailInput } from '../../../components/inputs/email-input/email-input'
import { Button } from '../../../components/button/button'
import { TableModule } from 'primeng/table'
import { CardModule } from 'primeng/card'
import { SelectModule } from 'primeng/select'
import { FormsModule } from '@angular/forms'
import { LoadingModal } from '../../../components/modals/loading-modal/loading-modal'

import { en } from '../../../locales/en'

import { MemberApiService } from '../../../../infrastructure/services/member.service'

import { GetMembersUseCase } from '../../../../application/usecases/member/get-members.usecase'
import { UpdateMemberRoleUseCase } from '../../../../application/usecases/member/update-member-role.usecase'
import { DeleteMemberFromOrgUseCase } from '../../../../application/usecases/member/delete-member-from-org.usecase'

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
	],
  templateUrl: './members.html',
  styleUrl: './members.scss'
})
export class Members {

	private getMembersUseCase: GetMembersUseCase
	private updateMemberRoleUseCase: UpdateMemberRoleUseCase
	private deleteMemberFromOrgUseCase: DeleteMemberFromOrgUseCase

	constructor(){
		const memberApiService = new MemberApiService()
		this.getMembersUseCase = new GetMembersUseCase(memberApiService)
		this.updateMemberRoleUseCase = new UpdateMemberRoleUseCase(memberApiService)
		this.deleteMemberFromOrgUseCase = new DeleteMemberFromOrgUseCase(memberApiService)
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

	ngOnInit(){
		this.getMembers()
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

}
