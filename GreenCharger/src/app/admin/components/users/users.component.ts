import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../../services/user.service';
import { MessageService } from '../../../services/message.service';
import { User, UserDto, CreateUserRequest, UpdateUserRequest } from '../../../models/user.model';
import { UserDetailsComponent } from './user-details/user-details.component';
import { UserFormComponent } from './user-form/user-form.component';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, UserDetailsComponent, UserFormComponent],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  searchTerm: string = '';
  loading = false;
  error: string | null = null;
  roles: string[] = [];
  
  // Modals
  showUserDetails = false;
  showUserForm = false;
  formMode: 'add' | 'edit' = 'add';
  selectedUser: User | null = null;
  selectedRoleForForm: string | null = null;

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;

  constructor(
    private userService: UserService,
    private messageService: MessageService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadUsers();
    this.userService.getRoles().subscribe({
      next: roles => { this.roles = roles; },
      error: () => {}
    });
  }

  loadUsers(): void {
    this.loading = true;
    this.error = null;
    
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.filteredUsers = users;
        this.totalItems = users.length;
        this.loading = false;
        console.log('Users loaded:', users);
      },
      error: (error: any) => {
        this.error = 'Không thể tải danh sách người dùng';
        this.loading = false;
        console.error('Error loading users:', error);
        this.messageService.error('Lỗi', 'Không thể tải danh sách người dùng');
      }
    });
  }

  onSearch(): void {
    if (!this.searchTerm.trim()) {
      this.filteredUsers = this.users;
    } else {
      this.filteredUsers = this.users.filter(user =>
        user.firstName?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
    this.totalItems = this.filteredUsers.length;
    this.currentPage = 1;
  }

  onAddUser(): void {
    this.formMode = 'add';
    this.selectedUser = null;
    this.selectedRoleForForm = this.roles.includes('User') ? 'User' : (this.roles[0] || null);
    this.showUserForm = true;
    console.log('Add user mode, selectedUser:', this.selectedUser);
  }

  onEditUser(user: User): void {
    console.log('onEditUser called with user:', user);
    this.formMode = 'edit';
    this.selectedUser = { ...user }; // Create a copy to avoid reference issues
    // Assume first role or default to 'User' when editing (backend returns roles in DTO)
    this.selectedRoleForForm = (user as any).roles?.[0] || (this.roles.includes('User') ? 'User' : (this.roles[0] || null));
    this.showUserForm = true;
    console.log('Edit user mode, selectedUser:', this.selectedUser);
    console.log('showUserForm:', this.showUserForm);
    console.log('formMode:', this.formMode);
  }

  onViewUser(user: User): void {
    // Navigate to user detail page
    this.router.navigate(['/admin/users/detail', user.id]);
  }

  onToggleLock(user: User): void {
    const action = this.isUserLocked(user) ? 'mở khóa' : 'khóa';
    const actionText = this.isUserLocked(user) ? 'Mở khóa' : 'Khóa';
    
    this.messageService.confirm(
      `Xác nhận ${action}`,
      `Bạn có chắc chắn muốn ${action} tài khoản "${user.firstName} ${user.lastName}"?`,
      actionText,
      'Hủy'
    ).then((result) => {
      if (result.isConfirmed) {
        if (this.isUserLocked(user)) {
          // Unlock user
          this.userService.unlockUser(user.id).subscribe({
            next: () => {
              this.messageService.success('Thành công', 'Mở khóa tài khoản thành công');
              this.loadUsers();
            },
            error: (error: any) => {
              console.error('Error unlocking user:', error);
              this.messageService.error('Lỗi', 'Không thể mở khóa tài khoản');
            }
          });
        } else {
          // Lock user
          this.userService.lockUser(user.id).subscribe({
            next: () => {
              this.messageService.success('Thành công', 'Khóa tài khoản thành công');
              this.loadUsers();
            },
            error: (error: any) => {
              console.error('Error locking user:', error);
              this.messageService.error('Lỗi', 'Không thể khóa tài khoản');
            }
          });
        }
      }
    });
  }

  onSaveUser(userData: UserDto): void {
    if (this.formMode === 'add') {
      const createRequest: CreateUserRequest = {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password: 'TempPassword123!', // Default password, user should change on first login
        confirmPassword: 'TempPassword123!',
        emailConfirmed: true // Admin-created users are automatically confirmed
      };

      this.userService.createUser(createRequest).subscribe({
        next: (created) => {
          this.messageService.success('Thành công', 'Thêm người dùng thành công');
          // Set role after creation if selected
          if (created && created.id && this.selectedRoleForForm) {
            this.userService.updateUserRole(created.id, this.selectedRoleForForm).subscribe({
              next: () => {
                this.onCloseUserForm();
                this.loadUsers();
              },
              error: () => {
                this.onCloseUserForm();
                this.loadUsers();
              }
            });
          } else {
            this.onCloseUserForm();
            this.loadUsers();
          }
        },
        error: (error: any) => {
          console.error('Error creating user:', error);
          this.messageService.error('Lỗi', 'Không thể tạo người dùng mới');
        }
      });
    } else if (this.formMode === 'edit' && this.selectedUser) {
      const updateRequest: UpdateUserRequest = {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email
      };

      this.userService.updateUserProfile(this.selectedUser.id, updateRequest).subscribe({
        next: () => {
          this.messageService.success('Thành công', 'Cập nhật người dùng thành công');
          // Update role if changed
          if (this.selectedRoleForForm) {
            this.userService.updateUserRole(this.selectedUser!.id, this.selectedRoleForForm).subscribe({
              next: () => { this.onCloseUserForm(); this.loadUsers(); },
              error: () => { this.onCloseUserForm(); this.loadUsers(); }
            });
          } else {
            this.onCloseUserForm();
            this.loadUsers();
          }
        },
        error: (error: any) => {
          console.error('Error updating user:', error);
          this.messageService.error('Lỗi', 'Không thể cập nhật người dùng');
        }
      });
    }
  }

  onCloseUserDetails(): void {
    this.showUserDetails = false;
    this.selectedUser = null;
  }

  onCloseUserForm(): void {
    this.showUserForm = false;
    this.selectedUser = null;
  }

  isUserLocked(user: User): boolean {
    if (!user.lockoutEnabled) return false;
    if (!user.lockoutEnd) return false;
    return new Date(user.lockoutEnd) > new Date();
  }

  // Pagination methods
  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  get paginatedUsers(): User[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredUsers.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  changeItemsPerPage(items: number): void {
    this.itemsPerPage = items;
    this.currentPage = 1;
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const totalPages = this.totalPages;
    const current = this.currentPage;
    
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (current <= 4) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push(-1); // Ellipsis
        pages.push(totalPages);
      } else if (current >= totalPages - 3) {
        pages.push(1);
        pages.push(-1); // Ellipsis
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push(-1); // Ellipsis
        for (let i = current - 1; i <= current + 1; i++) {
          pages.push(i);
        }
        pages.push(-1); // Ellipsis
        pages.push(totalPages);
      }
    }
    
    return pages;
  }
}
