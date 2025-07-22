import { Component, inject, effect } from '@angular/core'
import { Router } from '@angular/router'
import { RouterOutlet } from '@angular/router'

import { Sidebar } from '../sidebar/sidebar'
import { Header } from '../header/header'
import { Footer } from '../footer/footer'

import { SessionService } from '../../../infrastructure/services/session.service'


@Component({
  selector: 'app-dashboard-layout',
  imports: [
    RouterOutlet,
    Sidebar,
    Header,
    Footer,
  ],
  templateUrl: './dashboard-layout.html',
  styleUrl: './dashboard-layout.scss'
})
export class DashboardLayout {

  private sessionService = inject(SessionService)
  private router = inject(Router)

  isLoggedIn = this.sessionService.isLoggedIn

  isSidebarCollapsed = false

  constructor() {
    effect(() => {
      if (!this.isLoggedIn()) {
        this.router.navigate(['/'])
      }
    })
  }

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed
  }

}
