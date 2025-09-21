import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../services/user.service';
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
  
  // Modals
  showUserDetails = false;
  showUserForm = false;
  formMode: 'add' | 'edit' = 'add';
  selectedUser: User | null = null;

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;

  constructor(private userService: UserService) { }

  ngOnInit(): void {
    this.loadUsers();
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
      error: (error) => {
        this.error = 'Không thể tải danh sách người dùng';
        this.loading = false;
        console.error('Error loading users:', error);
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
        user.email?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        user.phoneNumber?.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
    this.totalItems = this.filteredUsers.length;
    this.currentPage = 1;
  }

  onViewUser(user: User): void {
    this.selectedUser = user;
    this.showUserDetails = true;
  }
  
  onAddUser(): void {
    this.selectedUser = null;
    this.formMode = 'add';
    this.showUserForm = true;
  }

  onEditUser(user: User): void {
    this.selectedUser = user;
    this.formMode = 'edit';
    this.showUserForm = true;
  }

  onDeleteUser(user: User): void {
    if (confirm(`Bạn có chắc chắn muốn xóa người dùng "${user.firstName} ${user.lastName}"?`)) {
      this.loading = true;
      this.userService.deleteUser(user.id).subscribe({
        next: () => {
          this.loadUsers();
          this.loading = false;
        },
        error: (error) => {
          this.error = 'Không thể xóa người dùng';
          this.loading = false;
          console.error('Error deleting user:', error);
        }
      });
    }
  }

  onLockUser(user: User): void {
    if (confirm(`Bạn có chắc chắn muốn khóa tài khoản "${user.firstName} ${user.lastName}"?`)) {
      // Set a local loading state for this operation
      const userIndex = this.findUserIndex(user);
      
      this.userService.lockUser(user.id).subscribe({
        next: () => {
          // Update user locally instead of reloading all users
          if (userIndex !== -1) {
            // Set the lockout end date to a future date (e.g., 10 years from now)
            const lockoutEndDate = new Date();
            lockoutEndDate.setFullYear(lockoutEndDate.getFullYear() + 10);
            
            // Create a new user object with updated lockout information
            const updatedUser = { 
              ...this.users[userIndex],
              lockoutEnd: lockoutEndDate.toISOString(),
              lockoutEnabled: true
            };
            
            // Update both arrays to maintain consistency
            this.users[userIndex] = updatedUser;
            
            // Find the user in filtered users array and update it too
            const filteredIndex = this.filteredUsers.findIndex(u => u.id === user.id);
            if (filteredIndex !== -1) {
              this.filteredUsers[filteredIndex] = updatedUser;
            }
          }
        },
        error: (error) => {
          this.error = 'Không thể khóa tài khoản';
          console.error('Error locking user:', error);
        }
      });
    }
  }

  onUnlockUser(user: User): void {
    if (confirm(`Bạn có chắc chắn muốn mở khóa tài khoản "${user.firstName} ${user.lastName}"?`)) {
      // Set a local loading state for this operation
      const userIndex = this.findUserIndex(user);
      
      this.userService.unlockUser(user.id).subscribe({
        next: () => {
          // Update user locally instead of reloading all users
          if (userIndex !== -1) {
            // Set lockout end date to a past date instead of null
            // This ensures the user is unlocked without changing the type
            const pastDate = new Date();
            pastDate.setFullYear(pastDate.getFullYear() - 1); // Set to 1 year in the past
            
            // Create a new user object with updated lockout information
            const updatedUser = { 
              ...this.users[userIndex],
              lockoutEnd: pastDate.toISOString(),
              lockoutEnabled: false
            };
            
            // Update both arrays to maintain consistency
            this.users[userIndex] = updatedUser;
            
            // Find the user in filtered users array and update it too
            const filteredIndex = this.filteredUsers.findIndex(u => u.id === user.id);
            if (filteredIndex !== -1) {
              this.filteredUsers[filteredIndex] = updatedUser;
            }
          }
        },
        error: (error) => {
          this.error = 'Không thể mở khóa tài khoản';
          console.error('Error unlocking user:', error);
        }
      });
    }
  }
  
  // Helper method to find a user's index in the users array
  findUserIndex(user: User): number {
    return this.users.findIndex(u => u.id === user.id);
  }
  
  onSaveUser(userData: CreateUserRequest | UpdateUserRequest): void {
    this.loading = true;
    
    if (this.formMode === 'add') {
      // Add new user
      this.userService.createUser(userData as CreateUserRequest).subscribe({
        next: () => {
          this.showUserForm = false;
          this.loadUsers();
          this.loading = false;
        },
        error: (error) => {
          this.error = 'Không thể thêm người dùng mới';
          this.loading = false;
          console.error('Error creating user:', error);
        }
      });
    } else if (this.formMode === 'edit' && this.selectedUser) {
      // Update existing user
      this.userService.updateUserProfile(this.selectedUser.id, userData as UpdateUserRequest).subscribe({
        next: () => {
          this.showUserForm = false;
          this.loadUsers();
          this.loading = false;
        },
        error: (error) => {
          this.error = 'Không thể cập nhật thông tin người dùng';
          this.loading = false;
          console.error('Error updating user:', error);
        }
      });
    }
  }
  
  onCloseModal(): void {
    this.showUserDetails = false;
    this.showUserForm = false;
  }

  isUserLocked(user: User): boolean {
    return !!(user.lockoutEnd && new Date(user.lockoutEnd) > new Date());
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
}
