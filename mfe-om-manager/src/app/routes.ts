import { Routes } from '@angular/router'

import { Login } from './presentation/pages/login/login'
import { NewPassword } from './presentation/pages/new-password/new-password'

import { Signup } from './presentation/pages/signup/signup'
import { ConfirmSignup } from './presentation/pages/signup/confirm/confirm'

import { DashboardLayout } from './presentation/layouts/dashboard-layout/dashboard-layout'
import { Dashboard } from './presentation/pages/dashboard/dashboard'

import { CreateOrganization } from './presentation/pages/dashboard/organizations/create-organization/create-organization'
import { UpdateOrganization } from './presentation/pages/dashboard/organizations/update-organization/update-organization'

import { Members } from './presentation/pages/dashboard/members/members'


export const routes: Routes = [

	{ path: '', component: Login },
	{ path: 'login/new-password', component: NewPassword },
	{ path: 'signup', component: Signup },
	{ path: 'signup/confirm', component: ConfirmSignup },

	{ 
		path: '',
		component: DashboardLayout,
		children: [
			{ path: 'dashboard', component: Dashboard },

			{ path: 'organizations/create', component: CreateOrganization },
			{ path: 'organizations/update', component: UpdateOrganization },
		
			{ path: 'members', component: Members},
		
		]
	},

]
