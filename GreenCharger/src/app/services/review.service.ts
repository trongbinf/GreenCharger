import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ReviewDto, CreateReviewDto, UpdateReviewDto, ReviewStatsDto } from '../models/review.model';

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private apiUrl = `${environment.apiUrl}/Review`;

  constructor(private http: HttpClient) { }

  getReviews(isApproved?: boolean, productId?: number, rating?: number): Observable<ReviewDto[]> {
    let params = new HttpParams();

    if (isApproved !== undefined) {
      params = params.set('isApproved', isApproved.toString());
    }
    if (productId) {
      params = params.set('productId', productId.toString());
    }
    if (rating) {
      params = params.set('rating', rating.toString());
    }

    return this.http.get<ReviewDto[]>(this.apiUrl, { params });
  }

  getProductReviews(productId: number, rating?: number): Observable<ReviewDto[]> {
    let params = new HttpParams();

    if (rating) {
      params = params.set('rating', rating.toString());
    }

    return this.http.get<ReviewDto[]>(`${this.apiUrl}/product/${productId}`, { params });
  }

  getReview(id: number): Observable<ReviewDto> {
    return this.http.get<ReviewDto>(`${this.apiUrl}/${id}`);
  }

  createReview(review: CreateReviewDto): Observable<ReviewDto> {
    return this.http.post<ReviewDto>(this.apiUrl, review);
  }

  updateReview(id: number, review: UpdateReviewDto): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, review);
  }

  deleteReview(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  approveReview(id: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/approve`, {});
  }

  rejectReview(id: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/reject`, {});
  }

  markHelpful(id: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/helpful`, {});
  }

  unmarkHelpful(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}/helpful`);
  }

  getProductReviewStats(productId: number): Observable<ReviewStatsDto> {
    return this.http.get<ReviewStatsDto>(`${this.apiUrl}/product/${productId}/stats`);
  }
}