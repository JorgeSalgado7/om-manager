import { Component, Input } from '@angular/core'
import { en } from '../../locales/en'
import { CommonModule } from '@angular/common'
import { RouterModule, Router } from '@angular/router'
import { AwsAuthService } from '../../../infrastructure/aws/aws-auth-service' 

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
  ],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss'
})
export class Sidebar {

  @Input() isCollapsed = false

  menu = en.layout.sidebar.menu

  constructor(
    private router: Router,
    private awsAuthService: AwsAuthService
  ) {}

  async logout(): Promise<void> {
    await this.awsAuthService.logout()
    this.router.navigate(['/']) 
  }

}
