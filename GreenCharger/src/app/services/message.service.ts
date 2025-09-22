import { Injectable } from '@angular/core';
import Swal, { SweetAlertIcon, SweetAlertOptions } from 'sweetalert2';

@Injectable({ providedIn: 'root' })
export class MessageService {
  private baseOptions: SweetAlertOptions = {
    confirmButtonColor: '#27ae60',
    cancelButtonColor: '#e74c3c',
    buttonsStyling: true,
    showConfirmButton: true
  };

  show(icon: SweetAlertIcon, title: string, text?: string, extra?: SweetAlertOptions) {
    const options = {
      icon,
      title,
      text,
      ...this.baseOptions,
      ...(extra || {})
    } as any; // Cast to any to avoid strict overload issues with unioned options
    return Swal.fire(options);
  }

  success(title: string, text?: string, extra?: SweetAlertOptions) {
    return this.show('success', title, text, extra);
  }

  error(title: string, text?: string, extra?: SweetAlertOptions) {
    return this.show('error', title, text, extra);
  }

  info(title: string, text?: string, extra?: SweetAlertOptions) {
    return this.show('info', title, text, extra);
  }

  warning(title: string, text?: string, extra?: SweetAlertOptions) {
    return this.show('warning', title, text, extra);
  }

  confirm(title: string, text?: string, confirmButtonText = 'Xác nhận', cancelButtonText = 'Hủy') {
    const options = {
      icon: 'question',
      title,
      text,
      showCancelButton: true,
      confirmButtonText,
      cancelButtonText,
      ...this.baseOptions
    } as any;
    return Swal.fire(options);
  }
} 