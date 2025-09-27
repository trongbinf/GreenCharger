import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { User, UserDto, CreateUserRequest, UpdateUserRequest } from '../../../../models/user.model';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.css']
})
export class UserFormComponent implements OnInit, OnChanges {
  @Input() user: User | null = null;
  @Input() isVisible = false;
  @Input() mode: 'add' | 'edit' = 'add';
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<UserDto>();

  userForm!: FormGroup;
  submitted = false;
  formTitle = '';
  passwordsMismatch = false;
  newPasswordsMismatch = false;

  // Password visibility toggles
  showNewPassword = false;
  showConfirmPassword = false;

  constructor(private fb: FormBuilder) { }

  ngOnInit(): void {
    this.initializeForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log('UserFormComponent ngOnChanges called', changes);
    
    // Check if any relevant input has changed
    const isVisibleChanged = changes['isVisible'] && changes['isVisible'].currentValue;
    const userChanged = changes['user'] && changes['user'].currentValue;
    const modeChanged = changes['mode'] && changes['mode'].currentValue;
    
    if (isVisibleChanged || userChanged || modeChanged) {
      this.initializeForm();
      this.formTitle = this.mode === 'add' ? 'Thêm người dùng mới' : 'Cập nhật thông tin người dùng';
      
      // If we have user data and we're in edit mode, patch the form
      if (this.mode === 'edit' && this.user) {
        console.log('Patching form with user data:', this.user);
        // Use setTimeout to ensure form is initialized
        setTimeout(() => {
          this.userForm.patchValue({
            firstName: this.user?.firstName || '',
            lastName: this.user?.lastName || '',
            email: this.user?.email || ''
          });
          console.log('Form patched with values:', this.userForm.value);
        }, 0);
      }
    }
  }

  private initializeForm(): void {
    // Create form with validators
    const formConfig: any = {
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]]
    };
    
    // Add password fields only for adding new users
    if (this.mode === 'add') {
      formConfig.password = ['', [Validators.required, Validators.minLength(6)]];
      formConfig.confirmPassword = ['', [Validators.required]];
    }
    
    // Add new password fields for edit mode
    if (this.mode === 'edit') {
      formConfig.newPassword = ['', [Validators.minLength(6)]];
      formConfig.confirmNewPassword = ['', []];
    }
    
    this.userForm = this.fb.group(formConfig);
    console.log('Form initialized:', this.userForm.value);
  }
  
  onSubmit(): void {
    this.submitted = true;
    
    if (this.userForm.invalid) {
      return;
    }
    
    if (this.mode === 'add') {
      // Check if passwords match
      if (this.userForm.get('password')?.value !== this.userForm.get('confirmPassword')?.value) {
        this.passwordsMismatch = true;
        return;
      } else {
        this.passwordsMismatch = false;
      }
    }
    
    if (this.mode === 'edit') {
      // Check if new passwords match (only if new password is provided)
      const newPassword = this.userForm.get('newPassword')?.value;
      const confirmNewPassword = this.userForm.get('confirmNewPassword')?.value;
      
      if (newPassword && newPassword !== confirmNewPassword) {
        this.newPasswordsMismatch = true;
        return;
      } else {
        this.newPasswordsMismatch = false;
      }
    }
    
    // Create UserDto for both add and edit modes
    const userData: UserDto = {
      id: this.user?.id || '',
      userName: this.userForm.get('email')?.value || '',
      email: this.userForm.get('email')?.value || '',
      emailConfirmed: true,
      phoneNumber: '',
      firstName: this.userForm.get('firstName')?.value || '',
      lastName: this.userForm.get('lastName')?.value || '',
      createdAt: this.user?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lockoutEnd: this.user?.lockoutEnd || '',
      lockoutEnabled: this.user?.lockoutEnabled || false
    };
    
    this.save.emit(userData);
  }
  
  onClose(): void {
    this.submitted = false;
    this.passwordsMismatch = false;
    this.newPasswordsMismatch = false;
    this.showNewPassword = false;
    this.showConfirmPassword = false;
    this.close.emit();
  }

  togglePasswordVisibility(field: 'new' | 'confirm'): void {
    switch (field) {
      case 'new':
        this.showNewPassword = !this.showNewPassword;
        break;
      case 'confirm':
        this.showConfirmPassword = !this.showConfirmPassword;
        break;
    }
  }
  
  get f() { return this.userForm.controls; }
}
