import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { WishlistDto, AddToWishlistDto } from '../models/wishlist.model';

@Injectable({
  providedIn: 'root'
})
export class WishlistService {
  private apiUrl = `${environment.apiUrl}/Wishlist`;

  constructor(private http: HttpClient) { }

  getWishlist(): Observable<WishlistDto[]> {
    return this.http.get<WishlistDto[]>(this.apiUrl);
  }

  getWishlistProductIds(): Observable<number[]> {
    return this.http.get<number[]>(`${this.apiUrl}/products`);
  }

  addToWishlist(data: AddToWishlistDto): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }

  removeFromWishlist(productId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${productId}`);
  }

  toggleWishlist(productId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/toggle/${productId}`, {});
  }

  checkInWishlist(productId: number): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/check/${productId}`);
  }

  getWishlistCount(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/count`);
  }

  clearWishlist(): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/clear`);
  }

  moveAllToCart(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/move-to-cart`, {});
  }
}