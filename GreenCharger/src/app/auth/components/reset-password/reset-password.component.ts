import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { UserService } from '../../../services/user.service';
import { ResetPasswordRequest } from '../../../models/user.model';
import { MessageService } from '../../../services/message.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {
  resetForm: FormGroup;
  isLoading = false;
  token = '';
  email = '';
  showPassword = false;
  showConfirmPassword = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private msg: MessageService
  ) {
    this.resetForm = this.fb.group({
      password: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.email = this.route.snapshot.queryParamMap.get('email') || '';
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
  }

  togglePasswordVisibility(): void { this.showPassword = !this.showPassword; }
  toggleConfirmPasswordVisibility(): void { this.showConfirmPassword = !this.showConfirmPassword; }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  submit(): void {
    if (!this.email || !this.token) {
      this.msg.error('Liên kết không hợp lệ', 'Thiếu email hoặc token');
      return;
    }

    if (this.resetForm.invalid) {
      this.msg.warning('Thiếu thông tin', 'Vui lòng kiểm tra các trường bắt buộc');
      Object.values(this.resetForm.controls).forEach(c => c.markAsTouched());
      return;
    }

    this.isLoading = true;
    const payload: ResetPasswordRequest = {
      email: this.email,
      token: this.token,
      newPassword: this.resetForm.value.password,
      confirmPassword: this.resetForm.value.confirmPassword
    };

    this.userService.resetPassword(payload).subscribe({
      next: res => {
        this.isLoading = false;
        this.msg.success('Đặt lại mật khẩu thành công');
        this.router.navigate(['/login']);
      },
      error: err => {
        this.isLoading = false;
        const message = err?.error?.message || 'Không thể đặt lại mật khẩu';
        this.msg.error('Thất bại', message);
      }
    });
  }

  getFieldError(fieldName: string): string {
    const field = this.resetForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return fieldName === 'password' ? 'Mật khẩu là bắt buộc' : 'Xác nhận mật khẩu là bắt buộc';
      }
      if (field.errors['pattern'] && fieldName === 'password') {
        return 'Mật khẩu phải là 6 chữ số';
      }
      if (field.errors['passwordMismatch']) {
        return 'Mật khẩu xác nhận không khớp';
      }
    }
    return '';
  }
} 