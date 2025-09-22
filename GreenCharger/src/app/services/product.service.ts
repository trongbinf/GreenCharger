import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import { Product, ProductDto } from "../models/product.model";
import { environment } from "../../environments/environment";

@Injectable({
  providedIn: "root"
})
export class ProductService {
  private apiUrl = `${environment.apiUrl}/Product`;

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem("token");
    return new HttpHeaders({
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    });
  }

  private getAuthHeadersForFormData(): HttpHeaders {
    const token = localStorage.getItem("token");
    return new HttpHeaders({
      "Authorization": `Bearer ${token}`
    });
  }

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(this.apiUrl);
  }

  getProductById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`);
  }

  createProduct(product: ProductDto): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, product, { headers: this.getAuthHeaders() });
  }

  updateProduct(id: number, product: ProductDto): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, product, { headers: this.getAuthHeaders() });
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }

  updateProductStatus(id: number, isActive: boolean): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/status`, { isActive }, { headers: this.getAuthHeaders() });
  }

  uploadProductImage(file: File): Observable<{ imageUrl: string }> {
    const formData = new FormData();
    formData.append("file", file);
    return this.http.post<{ imageUrl: string }>(`${this.apiUrl}/upload-image`, formData, { 
      headers: this.getAuthHeadersForFormData() 
    });
  }
}
