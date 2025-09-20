import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface DashboardStats {
  orders: number;
  products: number;
  users: number;
  revenue: number;
}

interface OrderStatusStats {
  pending: number;
  processing: number;
  delivering: number;
  delivered: number;
  cancelled: number;
}

interface ChartData {
  month: string;
  orders: number;
  revenue: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  dashboardStats: DashboardStats = {
    orders: 0,
    products: 0,
    users: 0,
    revenue: 0
  };

  orderStatusStats: OrderStatusStats = {
    pending: 0,
    processing: 0,
    delivering: 0,
    delivered: 0,
    cancelled: 0
  };

  chartData: ChartData[] = [];
  orderStatusData: any[] = [];

  constructor() {}

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    // TODO: Gọi API để lấy dữ liệu thực tế
    // Hiện tại sử dụng dữ liệu mẫu
    this.dashboardStats = {
      orders: 0,
      products: 0,
      users: 0,
      revenue: 0
    };

    this.orderStatusStats = {
      pending: 0,
      processing: 0,
      delivering: 0,
      delivered: 0,
      cancelled: 0
    };

    this.chartData = [];
    this.orderStatusData = [
      { status: 'Chờ xử lý', value: 0, color: '#faad14' },
      { status: 'Đang xử lý', value: 0, color: '#13c2c2' },
      { status: 'Đang giao hàng', value: 0, color: '#722ed1' },
      { status: 'Đã giao hàng', value: 0, color: '#52c41a' },
      { status: 'Đã hủy', value: 0, color: '#ff4d4f' }
    ];
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  }
}
