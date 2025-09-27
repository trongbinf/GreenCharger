import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Product } from '../../../../models/product.model';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-details.component.html',
  styleUrls: ['./product-details.component.css', './product-details.component.modal.css']
})
export class ProductDetailsComponent {
  @Input() product: Product | null = null;
  @Input() isVisible = false;
  @Output() close = new EventEmitter<void>();
  
  constructor(private sanitizer: DomSanitizer) {}
  
  onClose(): void {
    this.close.emit();
  }
  
  // Format currency
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  }
  
  // Sanitize HTML content
  getSafeHtml(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}
