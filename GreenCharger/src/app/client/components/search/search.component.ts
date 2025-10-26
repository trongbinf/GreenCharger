import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { HeaderComponent, FooterComponent } from '../../../core';
import { ProductService } from '../../../services/product.service';
import { VisitorTrackingApiService } from '../../../services/visitor-tracking-api.service';
import { Product } from '../../../models/product.model';

import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzRadioModule } from 'ng-zorro-antd/radio';

interface PriceRange { key: string; label: string; min?: number; max?: number; }

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    HeaderComponent,
    FooterComponent,
    NzBreadCrumbModule,
    NzGridModule,
    NzCardModule,
    NzTagModule,
    NzRadioModule
  ],
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css']
})
export class SearchComponent implements OnInit {
  query = '';
  allProducts: Product[] = [];
  results: Product[] = [];
  isLoading = false;
  error = '';

  // local filters
  sortBy: 'priceAsc' | 'priceDesc' = 'priceAsc';
  priceMin?: number;
  priceMax?: number;

  // radio ranges
  priceRanges: PriceRange[] = [
    { key: 'all', label: 'Tất cả' },
    { key: '50-100', label: '50.000 - 100.000', min: 50000, max: 100000 },
    { key: '100-300', label: '100.000 - 300.000', min: 100000, max: 300000 },
    { key: '300-700', label: '300.000 - 700.000', min: 300000, max: 700000 },
    { key: 'gt700', label: 'Trên 700.000', min: 700000 }
  ];
  selectedRangeKey: string = 'all';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private visitorTrackingApiService: VisitorTrackingApiService
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      this.query = params.get('q')?.trim() ?? '';
      this.fetch();
    });
  }

  onSortChange(): void {
    this.applyFilters();
  }

  onSelectRange(): void {
    const r = this.priceRanges.find(pr => pr.key === this.selectedRangeKey);
    this.priceMin = r?.min;
    this.priceMax = r?.max;
    this.applyFilters();
  }

  private fetch(): void {
    this.isLoading = true;
    this.error = '';
    this.productService.getProducts().subscribe({
      next: (list) => {
        this.allProducts = list.filter(p => p.isActive);
        this.search();
        this.isLoading = false;
      },
      error: () => {
        this.error = 'Không thể tải sản phẩm';
        this.allProducts = [];
        this.results = [];
        this.isLoading = false;
      }
    });
  }

  private search(): void {
    const q = this.query.toLowerCase();
    const base = !q
      ? this.allProducts
      : this.allProducts.filter(p =>
          p.name?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
        );
    this.results = base;
    this.applyFilters();
  }

  private applyFilters(): void {
    let out = [...this.results];
    if (this.priceMin != null) out = out.filter(p => (p.finalPrice ?? p.price) >= (this.priceMin as number));
    if (this.priceMax != null) out = out.filter(p => (p.finalPrice ?? p.price) <= (this.priceMax as number));

    if (this.sortBy === 'priceAsc') out.sort((a, b) => (a.finalPrice ?? a.price) - (b.finalPrice ?? b.price));
    if (this.sortBy === 'priceDesc') out.sort((a, b) => (b.finalPrice ?? b.price) - (a.finalPrice ?? a.price));

    this.results = out;
  }

  trackProductClick(product: Product): void {
    this.visitorTrackingApiService.trackProductClick(product.id, product.name);
  }

  getProductClickCount(productId: number): number {
    return this.visitorTrackingApiService.getProductClickCount(productId);
  }
} 