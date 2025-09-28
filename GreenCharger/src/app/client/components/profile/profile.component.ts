import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../../services/user.service';
import { MessageService } from '../../../services/message.service';
import { HeaderComponent } from '../../../core/components/header/header.component';
import { FooterComponent } from '../../../core/components/footer/footer.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HeaderComponent, FooterComponent],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  passwordForm: FormGroup;
  isLoading = false;
  isPasswordLoading = false;
  showPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;
  currentUser: any;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router,
    private msg: MessageService
  ) {
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.pattern(/^[0-9]{10,11}$/)]]
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    if (!this.userService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    this.currentUser = this.userService.getCurrentUser();
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    if (this.currentUser) {
      this.profileForm.patchValue({
        firstName: this.currentUser.firstName || '',
        lastName: this.currentUser.lastName || '',
        email: this.currentUser.email || '',
        phoneNumber: this.currentUser.phoneNumber || ''
      });
    }
  }

  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');
    
    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    return null;
  }

  onSubmitProfile(): void {
    if (this.profileForm.valid) {
      this.isLoading = true;
      
      const profileData = {
        firstName: this.profileForm.value.firstName,
        lastName: this.profileForm.value.lastName,
        email: this.profileForm.value.email,
        phoneNumber: this.profileForm.value.phoneNumber
      };

      this.userService.updateProfile(profileData).subscribe({
        next: (response: any) => {
          this.isLoading = false;
          this.msg.success('Cập nhật thông tin thành công');
          
          // Update current user data
          const updatedUser = { ...this.currentUser, ...profileData };
          localStorage.setItem('currentUser', JSON.stringify(updatedUser));
          this.currentUser = updatedUser;
        },
        error: (error: any) => {
          this.isLoading = false;
          console.error('Profile update error:', error);
          
          if (error.error && error.error.message) {
            this.msg.error('Cập nhật thất bại', error.error.message);
          } else {
            this.msg.error('Cập nhật thất bại', 'Có lỗi xảy ra. Vui lòng thử lại.');
          }
        }
      });
    } else {
      this.markFormGroupTouched(this.profileForm);
      this.msg.warning('Vui lòng kiểm tra lại thông tin');
    }
  }

  onSubmitPassword(): void {
    if (this.passwordForm.valid) {
      this.isPasswordLoading = true;
      
      const currentPassword = this.passwordForm.value.currentPassword;
      const newPassword = this.passwordForm.value.newPassword;

      // Check if new password is different from current password
      if (currentPassword === newPassword) {
        this.isPasswordLoading = false;
        this.msg.warning('Mật khẩu mới không được trùng với mật khẩu hiện tại');
        return;
      }

      this.userService.changePassword(currentPassword, newPassword).subscribe({
        next: (response: any) => {
          this.isPasswordLoading = false;
          this.passwordForm.reset();
          this.msg.success('Đổi mật khẩu thành công');
        },
        error: (error: any) => {
          this.isPasswordLoading = false;
          console.error('Password change error:', error);
          
          if (error.error && error.error.message) {
            if (error.error.message.includes('current password') || error.error.message.includes('mật khẩu hiện tại')) {
              this.msg.error('Sai mật khẩu hiện tại', 'Vui lòng kiểm tra lại mật khẩu hiện tại');
            } else if (error.error.message.includes('same') || error.error.message.includes('trùng')) {
              this.msg.warning('Mật khẩu mới không được trùng với mật khẩu hiện tại');
            } else {
              this.msg.error('Đổi mật khẩu thất bại', error.error.message);
            }
          } else {
            this.msg.error('Đổi mật khẩu thất bại', 'Có lỗi xảy ra. Vui lòng thử lại.');
          }
        }
      });
    } else {
      this.markFormGroupTouched(this.passwordForm);
      this.msg.warning('Vui lòng kiểm tra lại thông tin');
    }
  }

  togglePasswordVisibility(field: string): void {
    switch (field) {
      case 'current':
        this.showPassword = !this.showPassword;
        break;
      case 'new':
        this.showNewPassword = !this.showNewPassword;
        break;
      case 'confirm':
        this.showConfirmPassword = !this.showConfirmPassword;
        break;
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  getFieldError(form: FormGroup, fieldName: string): string {
    const field = form.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return `${this.getFieldLabel(fieldName)} là bắt buộc`;
      }
      if (field.errors['email']) {
        return 'Email không hợp lệ';
      }
      if (field.errors['minlength']) {
        return `${this.getFieldLabel(fieldName)} phải có ít nhất ${field.errors['minlength'].requiredLength} ký tự`;
      }
      if (field.errors['pattern']) {
        return `${this.getFieldLabel(fieldName)} không đúng định dạng`;
      }
      if (field.errors['passwordMismatch']) {
        return 'Mật khẩu xác nhận không khớp';
      }
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      firstName: 'Họ',
      lastName: 'Tên',
      email: 'Email',
      phoneNumber: 'Số điện thoại',
      currentPassword: 'Mật khẩu hiện tại',
      newPassword: 'Mật khẩu mới',
      confirmPassword: 'Xác nhận mật khẩu'
    };
    return labels[fieldName] || fieldName;
  }
}
