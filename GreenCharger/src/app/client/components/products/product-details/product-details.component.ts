import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
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
import { AiChatbotComponent } from './ai-chatbot.component';

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
    FooterComponent,
    AiChatbotComponent
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
  selectedImage: string = '';
  activeTab: 'description' | 'specifications' = 'description';

  // Messenger contact ID
  private readonly MESSENGER_ID = '101460071747686';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.loadProduct();
  }

  loadProduct(): void {
    const productId = this.route.snapshot.paramMap.get('id');
    if (!productId) {
      this.error = 'Không tìm thấy ID sản phẩm';
      return;
    }

    this.isLoading = true;
    this.error = '';

    this.productService.getProductById(+productId).subscribe({
      next: (product) => {
        this.product = product;
        this.selectedImage = product.mainImageUrl || '';
        this.loadRelatedProducts();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading product:', error);
        this.error = 'Không thể tải thông tin sản phẩm';
        this.isLoading = false;
      }
    });
  }

  loadRelatedProducts(): void {
    // Load all products and filter by category
    this.productService.getProducts().subscribe({
      next: (products: Product[]) => {
        if (this.product) {
          // Filter products by same category and exclude current product
          this.relatedProducts = products
            .filter(p => p.categoryId === this.product?.categoryId && p.id !== this.product?.id)
            .slice(0, 4); // Take only 4 related products
        }
      },
      error: (error) => {
        console.error('Error loading related products:', error);
      }
    });
  }

  selectImage(imageUrl: string): void {
    this.selectedImage = imageUrl;
  }

  getAllImages(product: Product): string[] {
    const images: string[] = [];
    
    if (product.mainImageUrl) {
      images.push(product.mainImageUrl);
    }
    
    if (product.imageUrls && product.imageUrls.length > 0) {
      images.push(...product.imageUrls);
    }
    
    return images;
  }

  increaseQuantity(): void {
    if (this.product && this.quantity < this.product.quantityInStock) {
      this.quantity++;
    }
  }

  decreaseQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  addToCart(): void {
    if (!this.product) return;

    this.loading = true;
    
    // Simulate API call
    setTimeout(() => {
      console.log(`Added ${this.quantity} x ${this.product?.name} to cart`);
      this.loading = false;
      // You can add toast notification here
    }, 1000);
  }

  setActiveTab(tab: 'description' | 'specifications'): void {
    this.activeTab = tab;
  }

  getSafeHtml(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  // Navigate to related product
  navigateToRelatedProduct(productId: number): void {
    console.log('Navigating to related product:', productId);
    console.log('Current route:', this.router.url);
    
    this.router.navigate(['/product', productId]).then(success => {
      if (success) {
        console.log('Navigation successful');
        // Force reload to ensure new product data loads
        setTimeout(() => {
          window.location.reload();
        }, 100);
      } else {
        console.log('Navigation failed');
      }
    }).catch(error => {
      console.error('Navigation error:', error);
    });
  }

  // Contact directly via Messenger
  contactDirectly(): void {
    if (!this.product) return;
    
    // Create Messenger message
    const message = `Xin chào! Tôi quan tâm đến sản phẩm "${this.product.name}" với giá ${this.formatCurrency(this.product.finalPrice || this.product.price)}. Bạn có thể tư vấn thêm thông tin không?`;
    
    // Create Messenger URL
    const messengerUrl = `https://m.me/${this.MESSENGER_ID}?text=${encodeURIComponent(message)}`;
    
    // Open Messenger
    window.open(messengerUrl, '_blank');
  }

  // Contact via WhatsApp (for related products)
  contactViaWhatsApp(product: Product): void {
    const message = `Xin chào! Tôi quan tâm đến sản phẩm "${product.name}" với giá ${this.formatCurrency(product.finalPrice || product.price)}. Bạn có thể tư vấn thêm thông tin không?`;
    const whatsappUrl = `https://wa.me/84901234567?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  }

  // Contact via Messenger
  contactViaMessenger(product: Product): void {
    // Create Messenger message
    const message = `Xin chào! Tôi quan tâm đến sản phẩm "${product.name}" với giá ${this.formatCurrency(product.finalPrice || product.price)}. Bạn có thể tư vấn thêm thông tin không?`;
    
    // Create Messenger URL
    const messengerUrl = `https://m.me/${this.MESSENGER_ID}?text=${encodeURIComponent(message)}`;
    
    // Open Messenger
    window.open(messengerUrl, '_blank');
  }

  // Format currency
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND' 
    }).format(amount);
  }

  // Get stars for rating display
  getStars(rating: number): number[] {
    return Array(5).fill(0).map((_, i) => i < Math.floor(rating) ? 1 : 0);
  }

  // Go back to previous page
  goBack(): void {
    this.router.navigate(['/products']);
  }
}
