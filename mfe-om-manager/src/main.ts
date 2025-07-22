import './app/config/amplify-config'
import { bootstrapApplication } from '@angular/platform-browser'
import { provideRouter, RouterOutlet } from '@angular/router'
import { routes } from './app/routes'
import { Component } from '@angular/core'
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async'
import { providePrimeNG } from 'primeng/config'
import Aura from '@primeuix/themes/aura'

@Component({
	standalone: true,
	imports: [RouterOutlet],
	selector: 'app-root',
	template: '<router-outlet />',
})

class Root {}


bootstrapApplication(Root, {
	providers: [
		provideRouter(routes),
		provideAnimationsAsync(),
    providePrimeNG({ 
			theme: {
				preset: Aura,
				options: {
					darkModeSelector: false || 'none'
				}
			}
		 })
	]
})