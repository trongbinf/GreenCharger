import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { UserService } from '../../../services/user.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  isMenuOpen = false;

  constructor(public userService: UserService, private router: Router) {}

  get currentUser(): any {
    return this.userService.getCurrentUser();
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  onSearch(query: string): void {
    const q = (query || '').trim();
    if (!q) { return; }
    this.router.navigate(['/search'], { queryParams: { q } });
  }

  logout(): void {
    this.userService.logout();
    this.isMenuOpen = false;
    this.router.navigate(['/']);
  }

  isAdmin(): boolean {
    return this.currentUser?.roles?.includes('Admin') || false;
  }
}
