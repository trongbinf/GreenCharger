import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product, ProductDto } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = 'http://localhost:5000/api/Product';

  constructor(private http: HttpClient) { }

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(this.apiUrl);
  }

  getProductById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`);
  }

  createProduct(product: ProductDto): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, product);
  }

  updateProduct(id: number, product: ProductDto): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, product);
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  uploadMainImage(file: File): Observable<{ imageUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ imageUrl: string }>(`${this.apiUrl}/upload-main-image`, formData);
  }

  uploadDetailImages(files: File[]): Observable<{ imageUrls: string[] }> {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    return this.http.post<{ imageUrls: string[] }>(`${this.apiUrl}/upload-detail-images`, formData);
  }

  getProductsByCategory(categoryId: number): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/category/${categoryId}`);
  }

  searchProducts(searchTerm: string): Observable<Product[]> {
    let params = new HttpParams().set('searchTerm', searchTerm);
    return this.http.get<Product[]>(`${this.apiUrl}/search`, { params });
  }

  updateProductStatus(id: number, isActive: boolean): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/status`, { isActive });
  }
}
