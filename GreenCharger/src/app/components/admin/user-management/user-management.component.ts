import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../../../services/user.service';
import { UserDto, CreateUserDto, UpdateUserDto } from '../../../models/user.model';

@Component({
  selector: 'app-user-management',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.css'
})
export class UserManagementComponent implements OnInit {
  users: UserDto[] = [];
  filteredUsers: UserDto[] = [];
  roles: string[] = [];
  
  userForm: FormGroup;
  editingUser: UserDto | null = null;
  showForm = false;
  loading = false;
  
  searchTerm = '';
  filterRole = '';
  filterStatus: boolean | undefined = undefined;

  constructor(
    private userService: UserService,
    private fb: FormBuilder
  ) {
    this.userForm = this.createForm();
  }

  ngOnInit() {
    this.loadUsers();
    this.loadRoles();
  }

  createForm(): FormGroup {
    return this.fb.group({
      userName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      phoneNumber: [''],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      isActive: [true],
      roles: [[]]
    }, { validators: this.passwordMatchValidator });
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

  loadUsers() {
    this.loading = true;
    this.userService.getUsers(this.searchTerm, this.filterRole, this.filterStatus)
      .subscribe({
        next: (data) => {
          this.users = data;
          this.filteredUsers = data;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading users:', error);
          this.loading = false;
        }
      });
  }

  loadRoles() {
    this.userService.getRoles().subscribe({
      next: (roles) => this.roles = roles,
      error: (error) => console.error('Error loading roles:', error)
    });
  }

  showCreateForm() {
    this.editingUser = null;
    this.userForm.reset();
    this.userForm.patchValue({
      isActive: true,
      roles: []
    });
    // Enable password fields for new user
    this.userForm.get('password')?.enable();
    this.userForm.get('confirmPassword')?.enable();
    this.showForm = true;
  }

  editUser(user: UserDto) {
    this.editingUser = user;
    this.userForm.patchValue({
      userName: user.userName,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      isActive: user.isActive,
      roles: user.roles
    });
    // Disable password fields for edit
    this.userForm.get('password')?.disable();
    this.userForm.get('confirmPassword')?.disable();
    this.showForm = true;
  }

  saveUser() {
    if (this.userForm.valid) {
      const formValue = this.userForm.getRawValue();
      
      if (this.editingUser) {
        const updateDto: UpdateUserDto = {
          firstName: formValue.firstName,
          lastName: formValue.lastName,
          phoneNumber: formValue.phoneNumber,
          isActive: formValue.isActive,
          roles: formValue.roles
        };

        this.userService.updateUser(this.editingUser.id, updateDto).subscribe({
          next: () => {
            this.loadUsers();
            this.showForm = false;
          },
          error: (error) => console.error('Error updating user:', error)
        });
      } else {
        const createDto: CreateUserDto = {
          userName: formValue.userName,
          email: formValue.email,
          firstName: formValue.firstName,
          lastName: formValue.lastName,
          phoneNumber: formValue.phoneNumber,
          password: formValue.password,
          roles: formValue.roles
        };

        this.userService.createUser(createDto).subscribe({
          next: () => {
            this.loadUsers();
            this.showForm = false;
          },
          error: (error) => console.error('Error creating user:', error)
        });
      }
    }
  }

  toggleUserStatus(user: UserDto) {
    this.userService.toggleUserStatus(user.id).subscribe({
      next: () => {
        this.loadUsers();
      },
      error: (error) => console.error('Error toggling user status:', error)
    });
  }

  deleteUser(user: UserDto) {
    if (confirm(`Bạn có chắc muốn xóa người dùng "${user.fullName}"?`)) {
      this.userService.deleteUser(user.id).subscribe({
        next: () => {
          this.loadUsers();
        },
        error: (error) => console.error('Error deleting user:', error)
      });
    }
  }

  applyFilters() {
    this.loadUsers();
  }

  clearFilters() {
    this.searchTerm = '';
    this.filterRole = '';
    this.filterStatus = undefined;
    this.loadUsers();
  }

  onRoleChange(role: string, checked: boolean) {
    const currentRoles = this.userForm.get('roles')?.value || [];
    if (checked) {
      if (!currentRoles.includes(role)) {
        currentRoles.push(role);
      }
    } else {
      const index = currentRoles.indexOf(role);
      if (index > -1) {
        currentRoles.splice(index, 1);
      }
    }
    this.userForm.patchValue({ roles: currentRoles });
  }

  isRoleSelected(role: string): boolean {
    const currentRoles = this.userForm.get('roles')?.value || [];
    return currentRoles.includes(role);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('vi-VN');
  }
}
