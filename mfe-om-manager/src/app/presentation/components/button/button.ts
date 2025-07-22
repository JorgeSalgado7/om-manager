import { Component, Input } from '@angular/core'
import { CommonModule } from '@angular/common'

@Component({
  selector: 'app-button',
	imports: [
		CommonModule,
	],
  templateUrl: './button.html',
  styleUrls: ['./button.scss']
})
export class Button {

  @Input() icon: string = ''
  @Input({ required: true }) text: string = ''
  @Input() type: 'button' | 'submit' | 'reset' = 'button'
  @Input() variant: 'primary' | 'danger'  = 'primary'
	@Input() disabled: boolean = false

  get buttonClasses(): string[] {
    return ['om_btn', `om_btn--${this.variant}`]
  }

}