import { Component, Input, Output, EventEmitter } from '@angular/core'
import { InputTextModule } from 'primeng/inputtext'
import { NgClass, CommonModule } from '@angular/common'

@Component({
  selector: 'app-code-input',
  imports: [
    InputTextModule,
    NgClass,
    CommonModule,
  ],
  templateUrl: './code-input.html',
  styleUrl: './code-input.scss'
})
export class CodeInput {

  @Input({ required: true }) label!: string
  @Input({ required: true }) placeholder!: string
  @Input({ required: true }) code!: string
  @Input({ required: true }) error!: boolean
  @Input({ required: true }) errorMessage!: string

  @Output() codeChange = new EventEmitter<string>()

  onInput(event: Event) {
    const value = (event.target as HTMLInputElement).value
    this.code = value
    this.codeChange.emit(value)  // Emitimos solo el string
  }
}
