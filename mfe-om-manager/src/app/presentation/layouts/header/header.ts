import { Component, EventEmitter, Output } from '@angular/core'

@Component({
  selector: 'app-header',
  templateUrl: './header.html',
  styleUrl: './header.scss',
  standalone: true
})
export class Header {

  @Output() toggleSidebar = new EventEmitter<void>()

  onToggleClick() {
    this.toggleSidebar.emit()
  }
	
}
