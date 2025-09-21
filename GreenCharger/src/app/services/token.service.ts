import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  constructor() {}

  decodeToken(token: string): any {
    if (!token) {
      return null;
    }

    try {
      // Get the payload part of the JWT token (second part)
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      
      // Decode the base64 string
      const jsonPayload = decodeURIComponent(
        window.atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  getRolesFromToken(token: string): string[] {
    const decodedToken = this.decodeToken(token);
    if (!decodedToken) {
      return [];
    }

    // Check for role claims, which might be under 'role' or 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'
    const roleClaim = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';
    
    // Get roles from token
    if (decodedToken[roleClaim]) {
      // Check if it's an array or a single value
      return Array.isArray(decodedToken[roleClaim]) 
        ? decodedToken[roleClaim] 
        : [decodedToken[roleClaim]];
    }
    
    if (decodedToken.role) {
      // Check if it's an array or a single value
      return Array.isArray(decodedToken.role) 
        ? decodedToken.role 
        : [decodedToken.role];
    }

    return [];
  }
}