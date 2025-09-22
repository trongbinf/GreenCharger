import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { UserService, EmailStatusResponse } from '../../../services/user.service';
import { RegisterRequest } from '../../../models/user.model';
import { MessageService } from '../../../services/message.service';
import { debounceTime, distinctUntilChanged, filter, switchMap, catchError, of } from 'rxjs';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  registerForm: FormGroup;
  isLoading = false;
  successMessage = '';
  errorMessage = '';
  showPassword = false;
  showConfirmPassword = false;
  emailStatus?: EmailStatusResponse;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router,
    private msg: MessageService
  ) {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      // password must be at least 6 characters
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });

    // Async check for existing email
    this.registerForm.get('email')?.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      filter((email: string) => !!email && this.registerForm.get('email')?.valid === true),
      switchMap((email: string) => this.userService.checkEmailStatus(email).pipe(catchError(() => of({ exists: false, emailConfirmed: false, message: '' } as EmailStatusResponse))))
    ).subscribe(result => {
      this.emailStatus = result;
      const emailCtrl = this.registerForm.get('email');
      if (result.exists && result.emailConfirmed) {
        emailCtrl?.setErrors({ emailTaken: true });
      } else {
        // preserve other errors
        if (emailCtrl?.hasError('emailTaken')) {
          const errs = { ...(emailCtrl.errors || {}) };
          delete (errs as any)['emailTaken'];
          emailCtrl.setErrors(Object.keys(errs).length ? errs : null);
        }
      }
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    return null;
  }

  resendConfirmation(): void {
    const email = (this.registerForm.value.email || '').trim();
    if (!email) { return; }
    this.userService.resendConfirmation(email).subscribe({
      next: res => this.msg.success('Đã gửi lại email xác nhận', res.message),
      error: err => this.msg.error('Gửi lại thất bại', err?.error?.message || 'Có lỗi xảy ra')
    });
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      // Clean input data (first/last name omitted per requirement)
      const payload: RegisterRequest = {
        firstName: '',
        lastName: '',
        email: (this.registerForm.value.email || '').trim(),
        password: this.registerForm.value.password,
        confirmPassword: this.registerForm.value.confirmPassword
      };
      
      this.userService.register(payload).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.successMessage = response.message || 'Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.';
          this.msg.success('Thành công', this.successMessage);
          
          // Redirect to login after 2 seconds
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.error?.message || 'Đăng ký thất bại. Vui lòng thử lại.';
          this.msg.error('Đăng ký thất bại', this.errorMessage);
        }
      });
    } else {
      const emailCtrl = this.registerForm.get('email');
      if (emailCtrl?.hasError('emailTaken')) {
        this.msg.error('Email đã đăng ký', 'Vui lòng dùng email khác hoặc đăng nhập.');
      } else {
        this.msg.warning('Thiếu thông tin', 'Vui lòng kiểm tra các trường bắt buộc');
      }
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      control?.markAsTouched();
    });
    // also mark confirmPassword to show mismatch early
    this.registerForm.get('confirmPassword')?.updateValueAndValidity();
  }

  getFieldError(fieldName: string): string {
    const field = this.registerForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        const fieldLabels: { [key: string]: string } = {
          'email': 'Email',
          'password': 'Mật khẩu',
          'confirmPassword': 'Xác nhận mật khẩu'
        };
        return `${fieldLabels[fieldName] || fieldName} là bắt buộc`;
      }
      if (field.errors['email']) {
        return 'Email không hợp lệ';
      }
      if (field.errors['emailTaken']) {
        return 'Email đã đăng ký';
      }
      if (field.errors['minlength'] && fieldName === 'password') {
        return 'Mật khẩu phải có ít nhất 6 ký tự';
      }
      if (field.errors['passwordMismatch']) {
        return 'Mật khẩu xác nhận không khớp';
      }
    }
    return '';
  }
}
