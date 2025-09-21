import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable } from "rxjs";
import { Category, CategoryDto } from "../models/category.model";

@Injectable({
  providedIn: "root"
})
export class CategoryService {
  private apiUrl = "http://localhost:5001/api/Category";

  constructor(private http: HttpClient) {}

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

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(this.apiUrl);
  }

  getCategoryById(id: number): Observable<Category> {
    return this.http.get<Category>(`${this.apiUrl}/${id}`);
  }

  createCategory(category: CategoryDto): Observable<Category> {
    return this.http.post<Category>(this.apiUrl, category, { headers: this.getAuthHeaders() });
  }

  updateCategory(id: number, category: CategoryDto): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, category, { headers: this.getAuthHeaders() });
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }

  uploadCategoryImage(file: File): Observable<{ imageUrl: string }> {
    const formData = new FormData();
    formData.append("file", file);
    return this.http.post<{ imageUrl: string }>(`${this.apiUrl}/upload-image`, formData, { 
      headers: this.getAuthHeadersForFormData() 
    });
  }
}
