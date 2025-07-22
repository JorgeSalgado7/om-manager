import { Component, Input, Output, EventEmitter } from '@angular/core'
import { InputTextModule } from 'primeng/inputtext'
import { NgClass, CommonModule } from '@angular/common'

@Component({
  selector: 'app-email-input',
  imports: [
		InputTextModule,
		NgClass,
		CommonModule,
	],
  templateUrl: './email-input.html',
  styleUrl: './email-input.scss'
})
export class EmailInput {

	@Input({ required: true }) label!: string
	@Input({ required: true }) placeholder!: string
	@Input({ required: true }) email!: string
	@Input({ required: true }) error!: boolean
	@Input({ required: true }) errorMessage!: string

	@Output() emailChange = new EventEmitter<string>()

	onInput(event: Event){
		this.emailChange.emit((event?.target as HTMLInputElement).value)
	}
	
}
