import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { UserService } from '../../../services/user.service';
import { ProductService } from '../../../services/product.service';
import { VisitorTrackingApiService } from '../../../services/visitor-tracking-api.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  stats = { totalUsers: 0, totalProducts: 0, totalOrders: 0, totalRevenue: 0 };
  visitorStats$: Observable<{
    totalVisitors: number;
    totalUsers: number;
    productClicks: number;
    weeklyVisitors: number;
    lastVisit: Date;
  }>;
  recentOrders: { id: number; customer: string; amount: number; status: string }[] = [];

  constructor(
    private users: UserService,
    private products: ProductService,
    private visitorTrackingApiService: VisitorTrackingApiService,
    private http: HttpClient
  ) {
    // Combine visitor stats and user count
    this.visitorStats$ = combineLatest([
      this.visitorTrackingApiService.getVisitorStats(),
      this.users.getUsers()
    ]).pipe(
      map(([visitorStats, users]) => ({
        totalVisitors: visitorStats.totalVisitors,
        totalUsers: users.length,
        productClicks: visitorStats.totalProductClicks,
        weeklyVisitors: visitorStats.weeklyVisitors,
        lastVisit: new Date(visitorStats.lastUpdated)
      }))
    );
  }

  ngOnInit(): void {
    this.loadStats();
  }

  private loadStats(): void {
    // Load user stats
    this.users.getUsers().subscribe({
      next: list => {
        this.stats.totalUsers = list.length;
      },
      error: () => {}
    });

    this.products.getProducts().subscribe({
      next: list => this.stats.totalProducts = list.length,
      error: () => {}
    });

    // Orders: use API /api/orders
    this.http.get<any[]>(`${environment.apiUrl}/orders`).subscribe({
      next: orders => {
        this.stats.totalOrders = orders.length;
        // Calculate revenue sum of TotalAmount if available
        const amounts = orders.map(o => (o.totalAmount ?? o.TotalAmount ?? 0));
        this.stats.totalRevenue = amounts.reduce((a: number, b: number) => a + (Number(b) || 0), 0);
        // Recent orders (top 5 by CreatedAt desc if available)
        const sorted = [...orders].sort((a, b) => new Date(b.createdAt || b.CreatedAt).getTime() - new Date(a.createdAt || a.CreatedAt).getTime());
        this.recentOrders = sorted.slice(0, 5).map(o => ({
          id: o.id ?? o.Id,
          customer: o.customerName ?? o.CustomerName ?? o.customer ?? '',
          amount: o.totalAmount ?? o.TotalAmount ?? 0,
          status: o.status ?? o.Status ?? ''
        }));
      },
      error: () => {}
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  }
}
