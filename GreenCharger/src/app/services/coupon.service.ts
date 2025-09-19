import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { 
  CouponDto, 
  CreateCouponDto, 
  UpdateCouponDto, 
  CouponValidationDto, 
  ValidateCouponDto,
  ApplyCouponDto,
  CouponUsageDto,
  CouponStatisticsDto
} from '../models/coupon.model';

@Injectable({
  providedIn: 'root'
})
export class CouponService {
  private apiUrl = `${environment.apiUrl}/Coupon`;

  constructor(private http: HttpClient) { }

  getCoupons(isActive?: boolean, isPublic?: boolean, search?: string): Observable<CouponDto[]> {
    let params = new HttpParams();

    if (isActive !== undefined) {
      params = params.set('isActive', isActive.toString());
    }
    if (isPublic !== undefined) {
      params = params.set('isPublic', isPublic.toString());
    }
    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<CouponDto[]>(this.apiUrl, { params });
  }

  getPublicCoupons(): Observable<CouponDto[]> {
    return this.http.get<CouponDto[]>(`${this.apiUrl}/public`);
  }

  getCoupon(id: number): Observable<CouponDto> {
    return this.http.get<CouponDto>(`${this.apiUrl}/${id}`);
  }

  createCoupon(coupon: CreateCouponDto): Observable<CouponDto> {
    return this.http.post<CouponDto>(this.apiUrl, coupon);
  }

  updateCoupon(id: number, coupon: UpdateCouponDto): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, coupon);
  }

  deleteCoupon(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  validateCoupon(validateDto: ValidateCouponDto): Observable<CouponValidationDto> {
    return this.http.post<CouponValidationDto>(`${this.apiUrl}/validate`, validateDto);
  }

  applyCoupon(applyDto: ApplyCouponDto): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/apply`, applyDto);
  }

  getUsageHistory(): Observable<CouponUsageDto[]> {
    return this.http.get<CouponUsageDto[]>(`${this.apiUrl}/usage-history`);
  }

  getStatistics(): Observable<CouponStatisticsDto> {
    return this.http.get<CouponStatisticsDto>(`${this.apiUrl}/statistics`);
  }
}