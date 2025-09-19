import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AddressDto, CreateAddressDto, UpdateAddressDto } from '../models/address.model';

@Injectable({
  providedIn: 'root'
})
export class AddressService {
  private apiUrl = `${environment.apiUrl}/Address`;

  constructor(private http: HttpClient) { }

  getAddresses(): Observable<AddressDto[]> {
    return this.http.get<AddressDto[]>(this.apiUrl);
  }

  getAddress(id: number): Observable<AddressDto> {
    return this.http.get<AddressDto>(`${this.apiUrl}/${id}`);
  }

  createAddress(address: CreateAddressDto): Observable<AddressDto> {
    return this.http.post<AddressDto>(this.apiUrl, address);
  }

  updateAddress(id: number, address: UpdateAddressDto): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, address);
  }

  deleteAddress(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  setDefaultAddress(id: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/set-default`, {});
  }
}