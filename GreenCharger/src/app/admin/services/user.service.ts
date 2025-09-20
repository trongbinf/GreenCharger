import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User, UserDto } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:5000/api/Account';

  constructor(private http: HttpClient) { }

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
}
