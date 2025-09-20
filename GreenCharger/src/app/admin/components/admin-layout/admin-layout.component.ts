import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.css'
})
export class AdminLayoutComponent implements OnInit {
  isCollapsed = false;
  selectedMenuKey: string = 'dashboard';
  currentTime: string = 'today';

  menuItems = [
    { key: 'dashboard', icon: 'dashboard', text: 'Tổng quan', link: '/admin/dashboard' },
    { key: 'users', icon: 'user', text: 'Người dùng', link: '/admin/users' },
    { key: 'categories', icon: 'tags', text: 'Danh mục', link: '/admin/categories' },
    { key: 'products', icon: 'inbox', text: 'Sản phẩm', link: '/admin/products' },
    { key: 'orders', icon: 'shopping-cart', text: 'Đơn hàng', link: '/admin/orders' },
    { key: 'slider', icon: 'picture', text: 'Slider', link: '/admin/slider' }
  ];

  ngOnInit(): void {
    this.updateSelectedMenuKey();
  }

  toggleCollapsed(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  updateSelectedMenuKey(): void {
    const path = window.location.pathname;
    const activeItem = this.menuItems.find(item => path.includes(item.link));
    if (activeItem) {
      this.selectedMenuKey = activeItem.key;
    }
  }

  onTimeRangeChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    this.currentTime = selectElement.value;
    console.log('Selected time range:', this.currentTime);
  }
}
