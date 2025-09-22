import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MessageService } from '../../../services/message.service';
import { UserService } from '../../../services/user.service';

@Component({
  selector: 'app-confirm-email',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './confirm-email.component.html',
  styleUrls: ['./confirm-email.component.css']
})
export class ConfirmEmailComponent implements OnInit {
  isLoading = true;
  success = false;
  message = '';
  email = '';
  token = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private msg: MessageService
  ) {}

  ngOnInit(): void {
    this.email = this.route.snapshot.queryParamMap.get('email') || '';
    this.token = this.route.snapshot.queryParamMap.get('token') || '';

    if (!this.email || !this.token) {
      this.isLoading = false;
      this.success = false;
      this.message = 'Liên kết xác nhận không hợp lệ.';
      return;
    }

    this.userService.confirmEmail(this.email, this.token).subscribe({
      next: res => {
        this.isLoading = false;
        this.success = true;
        this.message = res.message || 'Xác nhận email thành công!';
        this.msg.success('Thành công', this.message);
      },
      error: err => {
        this.isLoading = false;
        this.success = false;
        this.message = err?.error?.message || 'Xác nhận email thất bại.';
        this.msg.error('Thất bại', this.message);
      }
    });
  }

  goLogin(): void {
    this.router.navigate(['/login']);
  }
} 