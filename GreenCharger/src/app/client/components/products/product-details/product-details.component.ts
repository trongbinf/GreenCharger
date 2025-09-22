import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ProductService } from '../../../../services/product.service';
import { Product } from '../../../../models/product.model';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-details.component.html',
  styleUrls: ['./product-details.component.css']
})
export class ProductDetailsComponent implements OnInit {
  product?: Product;
  isLoading = false;
  error = '';

  constructor(private route: ActivatedRoute, private productService: ProductService) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) { this.error = 'Sản phẩm không hợp lệ'; return; }
    this.isLoading = true;
    this.productService.getProductById(id).subscribe({
      next: p => { this.product = p; this.isLoading = false; },
      error: _ => { this.error = 'Không thể tải chi tiết sản phẩm'; this.isLoading = false; }
    });
  }
} 