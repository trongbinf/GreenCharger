import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { UserDto, CreateUserDto, UpdateUserDto, ChangePasswordDto, ResetPasswordDto } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/User`;

  constructor(private http: HttpClient) { }

  getUsers(search?: string, role?: string, isActive?: boolean): Observable<UserDto[]> {
    let params = new HttpParams();

    if (search) {
      params = params.set('search', search);
    }
    if (role) {
      params = params.set('role', role);
    }
    if (isActive !== undefined) {
      params = params.set('isActive', isActive.toString());
    }

    return this.http.get<UserDto[]>(this.apiUrl, { params });
  }

  getUser(id: string): Observable<UserDto> {
    return this.http.get<UserDto>(`${this.apiUrl}/${id}`);
  }

  createUser(user: CreateUserDto): Observable<UserDto> {
    return this.http.post<UserDto>(this.apiUrl, user);
  }

  updateUser(id: string, user: UpdateUserDto): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, user);
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  toggleUserStatus(id: string): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/toggle-status`, {});
  }

  changePassword(id: string, changePasswordDto: ChangePasswordDto): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/change-password`, changePasswordDto);
  }

  resetPassword(resetPasswordDto: ResetPasswordDto): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/reset-password`, resetPasswordDto);
  }

  getRoles(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/roles`);
  }

  assignRole(userId: string, roleName: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${userId}/roles/${roleName}`, {});
  }

  removeRole(userId: string, roleName: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${userId}/roles/${roleName}`);
  }
}