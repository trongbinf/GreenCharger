import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { 
  User, 
  UserDto,
  LoginRequest, 
  LoginResponse, 
  RegisterRequest, 
  RegisterResponse, 
  ForgotPasswordRequest, 
  ForgotPasswordResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  CreateUserRequest,
  UpdateUserRequest
} from '../models/user.model';
import { TokenService } from './token.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:5000/api/Account';
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private tokenService: TokenService
  ) {
    // Check for stored token on service initialization
    const token = localStorage.getItem('token');
    if (token) {
      // Get stored user data
      const userData = JSON.parse(localStorage.getItem('currentUser') || '{}');
      
      // If roles are not in the stored user data, try to get them from the token
      if (!userData.roles || userData.roles.length === 0) {
        const roles = this.tokenService.getRolesFromToken(token);
        if (roles && roles.length > 0) {
          userData.roles = roles;
          localStorage.setItem('currentUser', JSON.stringify(userData));
        }
      }
      
      this.currentUserSubject.next(userData);
    }
  }

  // User management methods
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users`);
  }

  getUserById(id: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/${id}`);
  }

  updateUser(id: string, user: UserDto): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/users/${id}`, user);
  }

  lockUser(id: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/users/${id}/lock`, {});
  }

  unlockUser(id: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/users/${id}/unlock`, {});
  }

  updateUserRole(id: string, role: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/users/${id}/role`, { role });
  }

  // Authentication methods
  login(loginData: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, loginData)
      .pipe(
        tap(response => {
          const token = response.token;
          localStorage.setItem('token', token);
          
          // Store user data with roles
          const userData = response.user;
          console.log('Login response:', response);
          
          // If roles are not in the response, try to get them from the token
          if (!userData.roles || userData.roles.length === 0) {
            const roles = this.tokenService.getRolesFromToken(token);
            if (roles && roles.length > 0) {
              userData.roles = roles;
            }
          }
          
          localStorage.setItem('currentUser', JSON.stringify(userData));
          this.currentUserSubject.next(userData);
        })
      );
  }

  register(registerData: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/register`, registerData);
  }

  forgotPassword(forgotPasswordData: ForgotPasswordRequest): Observable<ForgotPasswordResponse> {
    return this.http.post<ForgotPasswordResponse>(`${this.apiUrl}/forgot-password`, forgotPasswordData);
  }

  resetPassword(resetPasswordData: ResetPasswordRequest): Observable<ResetPasswordResponse> {
    return this.http.post<ResetPasswordResponse>(`${this.apiUrl}/reset-password`, resetPasswordData);
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  getCurrentUser(): any {
    return this.currentUserSubject.value;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }
  
  // New admin user management methods
  createUser(userData: CreateUserRequest): Observable<User> {
    // Set emailConfirmed to true by default
    userData.emailConfirmed = true;
    return this.http.post<User>(`${this.apiUrl}/admin/users`, userData);
  }
  
  updateUserProfile(userId: string, userData: UpdateUserRequest): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/admin/users/${userId}`, userData);
  }
  
  deleteUser(userId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/admin/users/${userId}`);
  }
}
