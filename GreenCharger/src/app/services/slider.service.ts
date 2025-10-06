import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpEvent } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Slider } from '../models/slider.model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SliderService {
  private apiUrl = `${environment.apiUrl}/slider`;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  private getAuthHeadersForFormData(): HttpHeaders {
    const token = localStorage.getItem('token');
    // Do NOT set Content-Type here; the browser will set proper multipart boundary
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getActiveSliders(): Observable<Slider[]> {
    return this.http.get<Slider[]>(`${this.apiUrl}/active`);
  }

  getAllSliders(): Observable<Slider[]> {
    return this.http.get<Slider[]>(`${this.apiUrl}`);
  }

  getAdminSliders(): Observable<Slider[]> {
    return this.http.get<Slider[]>(`${this.apiUrl}/admin`, { headers: this.getAuthHeaders() });
  }

  updateSliderStatus(id: number, isActive: boolean): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/status`, isActive, { headers: this.getAuthHeaders() });
  }

  createSlider(slider: Partial<Slider>): Observable<Slider> {
    return this.http.post<Slider>(`${this.apiUrl}`, slider, { headers: this.getAuthHeaders() });
  }

  uploadImage(file: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ url: string }>(`${this.apiUrl}/upload-image`, formData, { headers: this.getAuthHeadersForFormData() });
  }

  uploadImageWithProgress(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ url: string }>(`${this.apiUrl}/upload-image`, formData, {
      headers: this.getAuthHeadersForFormData(),
      observe: 'events',
      reportProgress: true
    });
  }

  updateSlider(id: number, slider: Partial<Slider>): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, slider, { headers: this.getAuthHeaders() });
  }

  deleteSlider(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }
}


