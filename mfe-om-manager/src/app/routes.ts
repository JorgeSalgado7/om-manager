import { Routes } from '@angular/router'

import { Login } from './presentation/pages/login/login'
import { NewPassword } from './presentation/pages/new-password/new-password'

import { Signup } from './presentation/pages/signup/signup'
import { ConfirmSignup } from './presentation/pages/signup/confirm/confirm'

import { DashboardLayout } from './presentation/layouts/dashboard-layout/dashboard-layout'

import { Organizations } from './presentation/pages/dashboard/organizations/organizations'
import { CreateOrganization } from './presentation/pages/dashboard/organizations/create-organization/create-organization'

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

			{ path: 'organizations', component: Organizations },
			{ path: 'organizations/create', component: CreateOrganization },
		
			{ path: 'members', component: Members},
		
		]
	},

]
