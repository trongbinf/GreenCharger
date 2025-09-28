import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { UserService } from '../services/user.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GuestAuthGuard implements CanActivate {
  constructor(private userService: UserService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    // Check if user is already authenticated
    if (this.userService.isAuthenticated()) {
      const currentUser = this.userService.getCurrentUser();
      
      // If user is admin, redirect to admin dashboard
      if (currentUser?.roles?.includes('Admin')) {
        this.router.navigate(['/admin/dashboard']);
        return false;
      }
      
      // If user is regular user, redirect to home page
      this.router.navigate(['/']);
      return false;
    }
    
    // If not authenticated, allow access to login/register pages
    return true;
  }
}
