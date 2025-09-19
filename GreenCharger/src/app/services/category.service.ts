import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { CategoryDto, CreateCategoryDto, UpdateCategoryDto } from '../models/category.model';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private apiUrl = `${environment.apiUrl}/Category`;

  constructor(private http: HttpClient) { }

  getCategories(search?: string, isActive?: boolean): Observable<CategoryDto[]> {
    let params = new HttpParams();

    if (search) {
      params = params.set('search', search);
    }
    if (isActive !== undefined) {
      params = params.set('isActive', isActive.toString());
    }

    return this.http.get<CategoryDto[]>(this.apiUrl, { params })
      .pipe(
        catchError(this.handleError)
      );
  }

  getCategory(id: number): Observable<CategoryDto> {
    return this.http.get<CategoryDto>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  createCategory(category: CreateCategoryDto): Observable<CategoryDto> {
    return this.http.post<CategoryDto>(this.apiUrl, category)
      .pipe(
        catchError(this.handleError)
      );
  }

  updateCategory(id: number, category: UpdateCategoryDto): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, category)
      .pipe(
        catchError(this.handleError)
      );
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  toggleStatus(id: number): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/toggle-status`, {})
      .pipe(
        catchError(this.handleError)
      );
  }

  // Upload ảnh danh mục
  uploadCategoryImage(id: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('image', file);
    
    return this.http.post(`${this.apiUrl}/${id}/upload-image`, formData)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Xử lý lỗi
  private handleError(error: any): Observable<never> {
    console.error('Category Service Error:', error);
    return throwError(() => new Error(error.message || 'Server error'));
  }
}