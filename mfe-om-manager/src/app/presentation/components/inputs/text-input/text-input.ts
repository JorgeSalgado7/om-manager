import { Component, Input } from '@angular/core'
import { InputTextModule } from 'primeng/inputtext'
import { NgClass, CommonModule} from '@angular/common'

@Component({
  selector: 'app-text-input',
  imports: [
		InputTextModule,
		NgClass,
		CommonModule,
	],
  templateUrl: './text-input.html',
  styleUrl: './text-input.scss'
})
export class TextInput {

	@Input({ required: true }) label!: string
	@Input({ required: true }) placeholder!: string
	@Input({ required: true }) inputValue!: string
	@Input({ required: true }) error!: boolean
	@Input({ required: true }) errorMessage!: string

	onInput(event: Event){
		this.inputValue  = (event?.target as HTMLInputElement).value
	}

}
