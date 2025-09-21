import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { User, CreateUserRequest, UpdateUserRequest } from '../../../../models/user.model';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.css']
})
export class UserFormComponent implements OnInit {
  @Input() user: User | null = null;
  @Input() isVisible = false;
  @Input() mode: 'add' | 'edit' = 'add';
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<CreateUserRequest | UpdateUserRequest>();

  userForm!: FormGroup;
  submitted = false;
  formTitle = '';
  passwordsMismatch = false;

  constructor(private fb: FormBuilder) { }

  ngOnInit(): void {
    this.initializeForm();
  }

  ngOnChanges(): void {
    this.initializeForm();
    
    if (this.isVisible) {
      this.formTitle = this.mode === 'add' ? 'Thêm người dùng mới' : 'Cập nhật thông tin người dùng';
      
      if (this.mode === 'edit' && this.user) {
        this.userForm.patchValue({
          firstName: this.user.firstName || '',
          lastName: this.user.lastName || '',
          email: this.user.email || '',
          phoneNumber: this.user.phoneNumber || '',
          address: this.user.address || ''
        });
      }
    }
  }

  private initializeForm(): void {
    // Create form with validators
    const formConfig: any = {
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.pattern(/^[0-9\+\-\s]*$/)]],
      address: ['']
    };
    
    // Add password fields only for adding new users
    if (this.mode === 'add') {
      formConfig.password = ['', [Validators.required, Validators.minLength(6)]];
      formConfig.confirmPassword = ['', [Validators.required]];
    }
    
    this.userForm = this.fb.group(formConfig);
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
      
      // Create user with email confirmation set to true
      const userData: CreateUserRequest = {
        ...this.userForm.value,
        emailConfirmed: true
      };
      
      this.save.emit(userData);
    } else {
      // Update user data (no password fields)
      const userData: UpdateUserRequest = {
        firstName: this.userForm.get('firstName')?.value,
        lastName: this.userForm.get('lastName')?.value,
        email: this.userForm.get('email')?.value,
        phoneNumber: this.userForm.get('phoneNumber')?.value,
        address: this.userForm.get('address')?.value
      };
      
      this.save.emit(userData);
    }
  }
  
  onClose(): void {
    this.submitted = false;
    this.close.emit();
  }
  
  get f() { return this.userForm.controls; }
}