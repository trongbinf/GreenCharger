import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { UserService } from '../services/user.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdminAuthGuard implements CanActivate {
  constructor(private userService: UserService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    const currentUser = this.userService.getCurrentUser();
    
    // Check if user is authenticated and has admin role
    if (this.userService.isAuthenticated() && currentUser?.roles?.includes('Admin')) {
      return true;
    }
    
    // Redirect to login page if not authenticated or not an admin
    this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }
}