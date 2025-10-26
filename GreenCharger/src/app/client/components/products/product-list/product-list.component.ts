import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../../../services/product.service';
import { Product } from '../../../../models/product.model';
import { HeaderComponent, FooterComponent } from '../../../../core';
import { VisitorTrackingApiService } from '../../../../services/visitor-tracking-api.service';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { FormsModule } from '@angular/forms';

interface PriceRange { key: string; label: string; min?: number; max?: number; }

@Component({
  selector: 'app-product-list',
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
    NzPaginationModule,
    NzTagModule,
    NzSelectModule,
    NzInputNumberModule,
    NzCheckboxModule,
    NzRadioModule
  ],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css']
})
export class ProductListComponent implements OnInit {
  products: Product[] = [];
  isLoading = false;
  error = '';

  // filters & paging
  categoryId: number | null = null;
  page = 1;
  pageSize = 12;

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
    private productService: ProductService,
    private visitorTrackingApiService: VisitorTrackingApiService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      const cat = params.get('category');
      const page = params.get('page');
      this.categoryId = cat ? Number(cat) : null;
      this.page = page ? Math.max(1, Number(page)) : 1;
      this.load();
    });
  }

  onSelectRange(): void {
    const r = this.priceRanges.find(pr => pr.key === this.selectedRangeKey);
    this.priceMin = r?.min;
    this.priceMax = r?.max;
    this.onPageChange(1);
  }

  onSortChange(): void {
    this.onPageChange(1);
  }

  private load(): void {
    this.isLoading = true;
    this.error = '';
    this.productService.getProducts().subscribe({
      next: (list) => {
        const active = list.filter(p => p.isActive);
        this.products = this.categoryId ? active.filter(p => p.categoryId === this.categoryId) : active;
        this.isLoading = false;
      },
      error: () => {
        this.error = 'Không thể tải sản phẩm';
        this.isLoading = false;
        this.products = [];
      }
    });
  }

  private applyFilters(list: Product[]): Product[] {
    let out = [...list];
    if (this.priceMin != null) out = out.filter(p => (p.finalPrice ?? p.price) >= (this.priceMin as number));
    if (this.priceMax != null) out = out.filter(p => (p.finalPrice ?? p.price) <= (this.priceMax as number));

    if (this.sortBy === 'priceAsc') out.sort((a, b) => (a.finalPrice ?? a.price) - (b.finalPrice ?? b.price));
    if (this.sortBy === 'priceDesc') out.sort((a, b) => (b.finalPrice ?? b.price) - (a.finalPrice ?? a.price));
    return out;
  }

  get filteredProducts(): Product[] {
    return this.applyFilters(this.products);
  }

  get pagedProducts(): Product[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filteredProducts.slice(start, start + this.pageSize);
  }

  get total(): number { return this.filteredProducts.length; }

  onPageChange(p: number): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { category: this.categoryId ?? undefined, page: p },
      queryParamsHandling: 'merge'
    });
  }

  viewDetails(p: Product): void {
    this.visitorTrackingApiService.trackProductClick(p.id, p.name);
    this.router.navigate(['/product', p.id]);
  }

  trackProductClick(p: Product): void {
    this.visitorTrackingApiService.trackProductClick(p.id, p.name);
  }

  getProductClickCount(productId: number): number {
    return this.visitorTrackingApiService.getProductClickCount(productId);
  }
} 