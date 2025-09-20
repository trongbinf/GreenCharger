import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  stats = {
    totalUsers: 1250,
    totalProducts: 89,
    totalOrders: 156,
    totalRevenue: 125000000
  };

  recentOrders = [
    { id: 1, customer: 'Nguyễn Văn A', amount: 1500000, status: 'Đã giao' },
    { id: 2, customer: 'Trần Thị B', amount: 2300000, status: 'Đang giao' },
    { id: 3, customer: 'Lê Văn C', amount: 850000, status: 'Chờ xử lý' },
    { id: 4, customer: 'Phạm Thị D', amount: 3200000, status: 'Đã giao' },
    { id: 5, customer: 'Hoàng Văn E', amount: 1200000, status: 'Đang giao' }
  ];

  constructor() { }

  ngOnInit(): void {
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  }
}
