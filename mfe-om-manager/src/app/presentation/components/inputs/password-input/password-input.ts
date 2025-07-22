import { Component, Input,  Output, EventEmitter } from '@angular/core'
import { CommonModule } from '@angular/common'
import { PasswordModule } from 'primeng/password'
import { NgClass } from '@angular/common'
import { DividerModule } from 'primeng/divider'
import { FormsModule } from '@angular/forms'

@Component({
  selector: 'app-password-input',
  standalone: true,
  imports: [
    PasswordModule,
    DividerModule,
    NgClass,
		CommonModule,
    FormsModule
  ],
  templateUrl: './password-input.html',
  styleUrl: './password-input.scss'
})
export class PasswordInput {
  @Input({ required: true }) label!: string
  @Input({ required: true }) placeholder!: string
  @Input({ required: true }) password!: string
  @Input({ required: true }) error!: boolean
	@Input() errorMessage!: string
  @Input({ required: true }) isSignUp!: boolean

	@Output() passwordChange = new EventEmitter<string>()

  get value(): string {
    return this.password
  }

  set value(value: string) {
		this.password = value
		this.passwordChange.emit(value)
  }

}
