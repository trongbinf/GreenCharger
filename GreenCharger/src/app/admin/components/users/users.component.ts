import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { User, UserDto } from '../../interfaces/user.interface';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  searchTerm: string = '';
  loading = false;
  error: string | null = null;

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

  onEditUser(user: User): void {
    console.log('Edit user:', user);
  }

  onDeleteUser(user: User): void {
    if (confirm(`Bạn có chắc chắn muốn xóa người dùng "${user.firstName} ${user.lastName}"?`)) {
      console.log('Delete user:', user);
    }
  }

  onViewUser(user: User): void {
    console.log('View user:', user);
  }

  onCopyUser(user: User): void {
    console.log('Copy user:', user);
    // TODO: Implement copy user functionality
  }

  onLockUser(user: User): void {
    if (confirm(`Bạn có chắc chắn muốn khóa tài khoản "${user.firstName} ${user.lastName}"?`)) {
      this.userService.lockUser(user.id).subscribe({
        next: () => {
          this.loadUsers();
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
      this.userService.unlockUser(user.id).subscribe({
        next: () => {
          this.loadUsers();
        },
        error: (error) => {
          this.error = 'Không thể mở khóa tài khoản';
          console.error('Error unlocking user:', error);
        }
      });
    }
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
