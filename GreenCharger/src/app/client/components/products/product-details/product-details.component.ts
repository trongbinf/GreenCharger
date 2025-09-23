import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
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
  product?: Product;
  isLoading = false;
  error = '';
  quantity = 1;

  relatedProducts: Product[] = [];

  constructor(private route: ActivatedRoute, private productService: ProductService) {}

  ngOnInit(): void {
    // React to route param changes (when clicking related product)
    this.route.paramMap.subscribe(() => this.loadProduct());
  }

  private loadProduct(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) { this.error = 'Sản phẩm không hợp lệ'; return; }
    this.isLoading = true;
    this.productService.getProductById(id).subscribe({
      next: p => {
        this.product = p;
        this.isLoading = false;
        this.quantity = 1;
        this.loadRelated(p);
        // Scroll to top when navigating between related products
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: _ => { this.error = 'Không thể tải chi tiết sản phẩm'; this.isLoading = false; }
    });
  }

  private loadRelated(p: Product): void {
    if (!p?.categoryId) { this.relatedProducts = []; return; }
    this.productService.getProducts().subscribe({
      next: list => {
        const active = list.filter(x => x.isActive);
        this.relatedProducts = active
          .filter(x => x.categoryId === p.categoryId && x.id !== p.id)
          .slice(0, 8);
      }
    });
  }
} 