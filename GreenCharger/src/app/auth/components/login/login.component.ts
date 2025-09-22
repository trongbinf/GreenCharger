import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { UserService } from '../../../services/user.service';
import { LoginRequest } from '../../../models/user.model';
import { MessageService } from '../../../services/message.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  // Password visibility state
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router,
    private msg: MessageService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      // password must be at least 6 characters
      password: [
        '',
        [Validators.required, Validators.minLength(6)]
      ],
      rememberMe: [false]
    });
  }

  // Toggle password visibility
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const loginData: LoginRequest = {
        email: this.loginForm.value.email,
        password: this.loginForm.value.password,
        rememberMe: this.loginForm.value.rememberMe
      };
      
      this.userService.login(loginData).subscribe({
        next: (response) => {
          this.isLoading = false;
          
          // Get current user with roles from the service
          const currentUser = this.userService.getCurrentUser();
          
          this.msg.success('Đăng nhập thành công');
          if (currentUser && currentUser.roles && currentUser.roles.includes('Admin')) {
            this.router.navigate(['/admin/dashboard']);
          } else {
            this.router.navigate(['/']);
          }
        },
        error: (error) => {
          this.isLoading = false;
          const serverMsg: string = error?.error?.message || '';
          // Heuristics to show friendly errors
          if (/not\s*found|no\s*user|unregistered|không\s*tồn\s*tại/i.test(serverMsg)) {
            this.msg.error('Email chưa đăng ký', 'Vui lòng kiểm tra lại hoặc đăng ký tài khoản.');
          } else if (/inactive|locked|not\s*activated|chưa\s*kích\s*hoạt/i.test(serverMsg)) {
            this.msg.warning('Tài khoản chưa kích hoạt', 'Vui lòng kiểm tra email để kích hoạt.');
          } else if (/password|mật\s*khẩu|invalid\s*credentials/i.test(serverMsg)) {
            this.msg.error('Sai mật khẩu', 'Vui lòng nhập đúng mật khẩu 6 ký tự trở lên.');
          } else {
            this.msg.error('Đăng nhập thất bại', 'Có lỗi xảy ra. Vui lòng thử lại.');
          }
          this.errorMessage = serverMsg || 'Đăng nhập thất bại. Vui lòng thử lại.';
        }
      });
    } else {
      this.markFormGroupTouched();
      this.msg.warning('Thiếu thông tin', 'Vui lòng kiểm tra các trường bắt buộc');
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return `${fieldName === 'email' ? 'Email' : 'Mật khẩu'} là bắt buộc`;
      }
      if (field.errors['email']) {
        return 'Email không hợp lệ';
      }
      if (field.errors['minlength'] && fieldName === 'password') {
        return 'Mật khẩu phải có ít nhất 6 ký tự';
      }
    }
    return '';
  }
}
