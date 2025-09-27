import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ProductService } from '../../../../services/product.service';
import { Product } from '../../../../models/product.model';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { FormsModule } from '@angular/forms';
import { HeaderComponent, FooterComponent } from '../../../../core';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    NzBreadCrumbModule,
    NzGridModule,
    NzCardModule,
    NzButtonModule,
    NzInputNumberModule,
    NzTagModule,
    HeaderComponent,
    FooterComponent
  ],
  templateUrl: './product-details.component.html',
  styleUrls: ['./product-details.component.css']
})
export class ProductDetailsComponent implements OnInit {
  product: Product | null = null;
  quantity: number = 1;
  loading = false;
  isLoading = false;
  error: string = '';
  relatedProducts: Product[] = [];

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const productId = params['id'];
      if (productId) {
        this.loadProduct(productId);
      }
    });
  }

  loadProduct(id: string): void {
    this.loading = true;
    this.isLoading = true;
    this.error = '';
    this.productService.getProductById(Number(id)).subscribe({
      next: (product) => {
        this.product = product;
        this.loading = false;
        this.isLoading = false;
        this.loadRelatedProducts();
      },
      error: (error) => {
        console.error('Error loading product:', error);
        this.error = 'Không thể tải sản phẩm';
        this.loading = false;
        this.isLoading = false;
      }
    });
  }

  loadRelatedProducts(): void {
    if (this.product) {
      this.productService.getProducts().subscribe({
        next: (products) => {
          this.relatedProducts = products
            .filter(p => p.categoryId === this.product!.categoryId && p.id !== this.product!.id)
            .slice(0, 4);
        },
        error: (error) => {
          console.error('Error loading related products:', error);
        }
      });
    }
  }

  // Sanitize HTML content
  getSafeHtml(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  addToCart(): void {
    if (this.product) {
      // Implement add to cart logic
      console.log('Adding to cart:', this.product.id, this.quantity);
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  }
}
