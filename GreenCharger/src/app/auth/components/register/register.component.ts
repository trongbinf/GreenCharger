import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../../services/user.service';
import { MessageService } from '../../../services/message.service';
import { RegisterRequest } from '../../../models/user.model';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  showPassword = false;
  showConfirmPassword = false;
  emailStatus: any = null;
  isCheckingEmail = false;
  emailExists = false;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router,
    private msg: MessageService
  ) { }

  ngOnInit(): void {
    this.initializeForm();
    this.setupEmailValidation();
  }

  private initializeForm(): void {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  private setupEmailValidation(): void {
    // Check email status when email field changes
    this.registerForm.get('email')?.valueChanges
      .pipe(
        debounceTime(500), // Wait 500ms after user stops typing
        distinctUntilChanged(), // Only check if email actually changed
        switchMap(email => {
          if (email && this.isValidEmail(email)) {
            this.isCheckingEmail = true;
            return this.userService.checkEmailStatus(email);
          }
          return of(null);
        }),
        catchError(error => {
          console.error('Email check error:', error);
          this.isCheckingEmail = false;
          return of(null);
        })
      )
      .subscribe(response => {
        this.isCheckingEmail = false;
        if (response) {
          this.emailStatus = response;
          this.emailExists = response.exists;
          
          // Update form validation
          const emailControl = this.registerForm.get('email');
          if (response.exists) {
            emailControl?.setErrors({ emailExists: true });
          } else {
            // Remove emailExists error if it exists
            if (emailControl?.errors?.['emailExists']) {
              delete emailControl.errors['emailExists'];
              if (Object.keys(emailControl.errors).length === 0) {
                emailControl.setErrors(null);
              }
            }
          }
        }
      });
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    if (confirmPassword?.errors?.['passwordMismatch']) {
      delete confirmPassword.errors['passwordMismatch'];
      if (Object.keys(confirmPassword.errors).length === 0) {
        confirmPassword.setErrors(null);
      }
    }
    
    return null;
  }

  onSubmit(): void {
    if (this.registerForm.valid && !this.emailExists) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      // Clean input data
      const payload: RegisterRequest = {
        fullName: '',
        email: (this.registerForm.value.email || '').trim(),
        password: this.registerForm.value.password,
        confirmPassword: this.registerForm.value.confirmPassword
      };
      
      this.userService.register(payload).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.successMessage = response.message || 'Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.';
          this.msg.success('Thành công', this.successMessage);
          
          // Redirect to login page after successful registration
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Registration error:', error);
          
          if (error.error && error.error.message) {
            this.errorMessage = error.error.message;
          } else if (error.error && Array.isArray(error.error)) {
            // Handle validation errors
            this.errorMessage = error.error.map((err: any) => err.description || err.message).join(', ');
          } else {
            this.errorMessage = 'Đăng ký thất bại. Vui lòng thử lại.';
          }
          
          this.msg.error('Lỗi', this.errorMessage);
        }
      });
    } else {
      this.markFormGroupTouched();
      if (this.emailExists) {
        this.msg.error('Lỗi', 'Email này đã được sử dụng. Vui lòng chọn email khác.');
      }
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      control?.markAsTouched();
    });
  }

  get f() { return this.registerForm.controls; }

  get passwordMismatchError(): boolean {
    return this.f['confirmPassword'].errors?.['passwordMismatch'] && this.f['confirmPassword'].touched;
  }

  getFieldError(fieldName: string): string {
    const field = this.f[fieldName];
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return `${this.getFieldLabel(fieldName)} không được để trống`;
      }
      if (field.errors['email']) {
        return 'Email không đúng định dạng';
      }
      if (field.errors['emailExists']) {
        return 'Email này đã được sử dụng';
      }
      if (field.errors['minlength']) {
        return `${this.getFieldLabel(fieldName)} phải có ít nhất ${field.errors['minlength'].requiredLength} ký tự`;
      }
      if (field.errors['passwordMismatch']) {
        return 'Mật khẩu xác nhận không khớp';
      }
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      'email': 'Email',
      'password': 'Mật khẩu',
      'confirmPassword': 'Xác nhận mật khẩu'
    };
    return labels[fieldName] || fieldName;
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  resendConfirmation(): void {
    const email = this.registerForm.get('email')?.value;
    if (email) {
      this.userService.resendConfirmation(email).subscribe({
        next: (response) => {
          this.msg.success('Thành công', response.message || 'Đã gửi lại email xác nhận');
        },
        error: (error) => {
          this.msg.error('Lỗi', 'Không thể gửi lại email xác nhận');
        }
      });
    }
  }

  getEmailStatusMessage(): string {
    if (this.isCheckingEmail) {
      return 'Đang kiểm tra email...';
    }
    if (this.emailStatus?.exists) {
      return 'Email này đã được sử dụng';
    }
    if (this.emailStatus && !this.emailStatus.exists) {
      return 'Email có thể sử dụng';
    }
    return '';
  }

  getEmailStatusClass(): string {
    if (this.isCheckingEmail) {
      return 'email-checking';
    }
    if (this.emailStatus?.exists) {
      return 'email-exists';
    }
    if (this.emailStatus && !this.emailStatus.exists) {
      return 'email-available';
    }
    return '';
  }
}
