import { Component, Input } from '@angular/core'
import { DialogModule } from 'primeng/dialog'
import { ProgressSpinnerModule } from 'primeng/progressspinner'

@Component({
  selector: 'app-loading-modal',
  imports: [
		DialogModule,
		ProgressSpinnerModule,
	],
  templateUrl: './loading-modal.html',
  styleUrl: './loading-modal.scss'
})
export class LoadingModal {

	@Input({ required: true }) isLoading!: boolean

}
