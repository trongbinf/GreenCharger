import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';

interface MenuItem {
  key: string;
  title: string;
  icon: string;
  path: string;
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet
  ],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.css']
})
export class AdminLayoutComponent implements OnInit {
  isCollapsed = false;
  selectedMenuKey = 'dashboard';
  currentTime = '30 ngày qua';

  menuItems: MenuItem[] = [
    { key: 'dashboard', title: 'Tổng quan', icon: 'dashboard', path: '/admin/dashboard' },
    { key: 'users', title: 'Người dùng', icon: 'user', path: '/admin/users' },
    { key: 'categories', title: 'Danh mục', icon: 'appstore', path: '/admin/categories' },
    { key: 'products', title: 'Sản phẩm', icon: 'inbox', path: '/admin/products' },
    { key: 'orders', title: 'Đơn hàng', icon: 'shopping-cart', path: '/admin/orders' },
    { key: 'slider', title: 'Slider', icon: 'picture', path: '/admin/slider' }
  ];

  constructor(private router: Router) {}

  ngOnInit() {
    // Lắng nghe thay đổi route để cập nhật menu được chọn
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        const url = event.url;
        const currentItem = this.menuItems.find(item => url.includes(item.path));
        if (currentItem) {
          this.selectedMenuKey = currentItem.key;
        }
      });
  }

  onMenuClick(item: MenuItem) {
    this.selectedMenuKey = item.key;
    this.router.navigate([item.path]);
  }

  onTimeRangeChange(value: string) {
    this.currentTime = value;
  }
}
