import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.css']
})
export class OrdersComponent implements OnInit {
  orders = [
    { id: 1, customer: 'Nguyễn Văn A', amount: 1500000, status: 'Đã giao', date: '2024-01-15' },
    { id: 2, customer: 'Trần Thị B', amount: 2300000, status: 'Đang giao', date: '2024-01-14' },
    { id: 3, customer: 'Lê Văn C', amount: 850000, status: 'Chờ xử lý', date: '2024-01-13' }
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
