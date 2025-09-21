import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { UserService } from '../../../services/user.service';
import { ForgotPasswordRequest } from '../../../models/user.model';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent {
  forgotPasswordForm: FormGroup;
  isLoading = false;
  successMessage = '';
  errorMessage = '';
  emailSent = false;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router
  ) {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void {
    if (this.forgotPasswordForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      const forgotPasswordData: ForgotPasswordRequest = this.forgotPasswordForm.value;
      
      this.userService.forgotPassword(forgotPasswordData).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.emailSent = true;
          this.successMessage = response.message || 'Email khôi phục mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư của bạn.';
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.error?.message || 'Có lỗi xảy ra. Vui lòng thử lại.';
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.forgotPasswordForm.controls).forEach(key => {
      const control = this.forgotPasswordForm.get(key);
      control?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string {
    const field = this.forgotPasswordForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return 'Email là bắt buộc';
      }
      if (field.errors['email']) {
        return 'Email không hợp lệ';
      }
    }
    return '';
  }

  backToLogin(): void {
    this.router.navigate(['/login']);
  }

  resendEmail(): void {
    this.emailSent = false;
    this.successMessage = '';
    this.errorMessage = '';
  }
}
