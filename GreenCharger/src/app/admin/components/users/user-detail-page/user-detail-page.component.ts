import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../../../services/user.service';
import { MessageService } from '../../../../services/message.service';
import { User } from '../../../../models/user.model';

@Component({
  selector: 'app-user-detail-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-detail-page.component.html',
  styleUrls: ['./user-detail-page.component.css']
})
export class UserDetailPageComponent implements OnInit {
  user: User | null = null;
  loading = false;
  error: string | null = null;
  userId: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.userId = params['id'];
      if (this.userId) {
        this.loadUser();
      }
    });
  }

  loadUser(): void {
    this.loading = true;
    this.error = null;

    this.userService.getUserById(this.userId).subscribe({
      next: (user: User) => {
        this.user = user;
        this.loading = false;
        console.log('User loaded:', user);
      },
      error: (error: any) => {
        this.error = 'Không thể tải thông tin người dùng';
        this.loading = false;
        console.error('Error loading user:', error);
        this.messageService.error('Lỗi', 'Không thể tải thông tin người dùng');
      }
    });
  }

  onEditUser(): void {
    if (this.user) {
      this.router.navigate(['/admin/users/edit', this.user.id]);
    }
  }

  onToggleLock(): void {
    if (!this.user) return;

    const action = this.isUserLocked() ? 'mở khóa' : 'khóa';
    const actionText = this.isUserLocked() ? 'Mở khóa' : 'Khóa';
    
    this.messageService.confirm(
      `Xác nhận ${action}`,
      `Bạn có chắc chắn muốn ${action} tài khoản "${this.user.firstName} ${this.user.lastName}"?`,
      actionText,
      'Hủy'
    ).then((result: any) => {
      if (result.isConfirmed) {
        if (this.isUserLocked()) {
          // Unlock user
          this.userService.unlockUser(this.user!.id).subscribe({
            next: () => {
              this.messageService.success('Thành công', 'Mở khóa tài khoản thành công');
              this.loadUser(); // Reload user data
            },
            error: (error: any) => {
              console.error('Error unlocking user:', error);
              this.messageService.error('Lỗi', 'Không thể mở khóa tài khoản');
            }
          });
        } else {
          // Lock user
          this.userService.lockUser(this.user!.id).subscribe({
            next: () => {
              this.messageService.success('Thành công', 'Khóa tài khoản thành công');
              this.loadUser(); // Reload user data
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

  onBackToList(): void {
    this.router.navigate(['/admin/users']);
  }

  isUserLocked(): boolean {
    if (!this.user?.lockoutEnabled) return false;
    if (!this.user?.lockoutEnd) return false;
    return new Date(this.user.lockoutEnd) > new Date();
  }

  getFullName(): string {
    if (!this.user) return '';
    return `${this.user.firstName} ${this.user.lastName}`.trim();
  }

  getStatusText(): string {
    if (!this.user) return '';
    return this.isUserLocked() ? 'Đã khóa' : 'Hoạt động';
  }

  getStatusClass(): string {
    if (!this.user) return '';
    return this.isUserLocked() ? 'status-locked' : 'status-active';
  }

  getEmailStatusText(): string {
    if (!this.user) return '';
    return this.user.emailConfirmed ? 'Đã xác thực' : 'Chưa xác thực';
  }

  getEmailStatusClass(): string {
    if (!this.user) return '';
    return this.user.emailConfirmed ? 'email-confirmed' : 'email-unconfirmed';
  }
}
