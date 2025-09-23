import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../../../services/product.service';
import { Product } from '../../../../models/product.model';
import { HeaderComponent, FooterComponent } from '../../../../core';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzTagModule } from 'ng-zorro-antd/tag';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HeaderComponent,
    FooterComponent,
    NzBreadCrumbModule,
    NzGridModule,
    NzCardModule,
    NzPaginationModule,
    NzTagModule
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

  constructor(
    private productService: ProductService,
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

  get pagedProducts(): Product[] {
    const start = (this.page - 1) * this.pageSize;
    return this.products.slice(start, start + this.pageSize);
  }

  get total(): number { return this.products.length; }

  onPageChange(p: number): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { category: this.categoryId ?? undefined, page: p },
      queryParamsHandling: 'merge'
    });
  }

  viewDetails(p: Product): void {
    this.router.navigate(['/product', p.id]);
  }
} 