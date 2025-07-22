import { Component } from '@angular/core'
import { en } from '../../locales/en'

@Component({
  selector: 'app-footer',
  imports: [],
  templateUrl: './footer.html',
  styleUrl: './footer.scss'
})
export class Footer {

	title: string = en.layout.footer.title
	subtitle: string = en.layout.footer.subtitle

}
