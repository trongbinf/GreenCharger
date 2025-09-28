import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent, FooterComponent } from '../../../core';
import { CategoryService } from '../../../services/category.service';
import { ProductService } from '../../../services/product.service';
import { Category } from '../../../models/category.model';
import { Product } from '../../../models/product.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, FooterComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  categories: Category[] = [];
  isLoadingCategories = false;
  categoriesError = '';

  featuredProducts: Product[] = [];
  isLoadingProducts = false;
  productsError = '';

  currentSlide = 0;
  slides = [
   
    {
      id: 1,
      image: 'https://res.cloudinary.com/dafzz2c9j/image/upload/v1759077671/z7060360293839_cff022530c1b6a7c34ec883e2e54bac7_leu07g.jpg'
    },
    {
      id: 2,
      image: 'https://res.cloudinary.com/dafzz2c9j/image/upload/v1759077671/1_dppzqu.jpg'
    }
  ];

  constructor(
    private categoryService: CategoryService,
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    this.startSlider();
    this.loadCategories();
    this.loadFeaturedProducts();
  }

  loadCategories(): void {
    this.isLoadingCategories = true;
    this.categoriesError = '';
    
    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        this.isLoadingCategories = false;
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.categoriesError = 'Không thể tải danh mục sản phẩm';
        this.isLoadingCategories = false;
        
        // Fallback to mock data if API fails
        this.categories = [
          {
            id: 1,
            name: 'Sạc iPhone',
            imageUrl: 'https://via.placeholder.com/200x200/1e3c72/ffffff?text=iPhone',
            description: 'Sạc chuyên dụng cho iPhone',
            productCount: 25
          },
          {
            id: 2,
            name: 'Sạc Samsung',
            imageUrl: 'https://via.placeholder.com/200x200/2a5298/ffffff?text=Samsung',
            description: 'Sạc chuyên dụng cho Samsung',
            productCount: 18
          },
          {
            id: 3,
            name: 'Sạc USB-C',
            imageUrl: 'https://via.placeholder.com/200x200/1e3c72/ffffff?text=USB-C',
            description: 'Sạc USB-C đa năng',
            productCount: 32
          },
          {
            id: 4,
            name: 'Sạc Wireless',
            imageUrl: 'https://via.placeholder.com/200x200/2a5298/ffffff?text=Wireless',
            description: 'Sạc không dây tiện lợi',
            productCount: 15
          }
        ];
      }
    });
  }

  loadFeaturedProducts(): void {
    this.isLoadingProducts = true;
    this.productsError = '';
    
    this.productService.getProducts().subscribe({
      next: (products) => {
        // Filter only active products
        const activeProducts = products.filter(product => product.isActive);
        
        // Shuffle array and take first 9 products
        const shuffled = this.shuffleArray([...activeProducts]);
        this.featuredProducts = shuffled.slice(0, 9);
        
        this.isLoadingProducts = false;
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.productsError = 'Không thể tải sản phẩm nổi bật';
        this.isLoadingProducts = false;
        
        // Fallback to mock data if API fails
        this.featuredProducts = [
          {
            id: 1,
            name: 'Sạc iPhone 15 Pro Max',
            description: 'Sạc nhanh cho iPhone 15 Pro Max',
            price: 299000,
            discount: 25,
            discountPrice: 224250,
            finalPrice: 224250,
            stockQuantity: 50,
            quantityInStock: 50,
            mainImageUrl: 'https://via.placeholder.com/300x300/1e3c72/ffffff?text=iPhone+15+Pro+Max',
            detailImageUrls: [],
            imageUrls: ['https://via.placeholder.com/300x300/1e3c72/ffffff?text=iPhone+15+Pro+Max'],
            categoryId: 1,
            categoryName: 'Sạc điện thoại',
            isActive: true,
            isNew: false,
            isOnSale: true,
            isFeatured: true,
            averageRating: 4.8,
            reviewCount: 156,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          },
          {
            id: 2,
            name: 'Sạc Samsung Galaxy S24',
            description: 'Sạc nhanh cho Samsung Galaxy S24',
            price: 249000,
            discount: 15,
            discountPrice: 211650,
            finalPrice: 211650,
            stockQuantity: 30,
            quantityInStock: 30,
            mainImageUrl: 'https://via.placeholder.com/300x300/2a5298/ffffff?text=Galaxy+S24',
            detailImageUrls: [],
            imageUrls: ['https://via.placeholder.com/300x300/2a5298/ffffff?text=Galaxy+S24'],
            categoryId: 1,
            categoryName: 'Sạc điện thoại',
            isActive: true,
            isNew: true,
            isOnSale: false,
            isFeatured: true,
            averageRating: 4.7,
            reviewCount: 89,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          },
          {
            id: 3,
            name: 'Sạc USB-C Universal',
            description: 'Sạc USB-C đa năng',
            price: 199000,
            discount: 20,
            discountPrice: 159200,
            finalPrice: 159200,
            stockQuantity: 75,
            quantityInStock: 75,
            mainImageUrl: 'https://via.placeholder.com/300x300/1e3c72/ffffff?text=USB-C+Universal',
            detailImageUrls: [],
            imageUrls: ['https://via.placeholder.com/300x300/1e3c72/ffffff?text=USB-C+Universal'],
            categoryId: 3,
            categoryName: 'Dây sạc',
            isActive: true,
            isNew: false,
            isOnSale: true,
            isFeatured: true,
            averageRating: 4.6,
            reviewCount: 234,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          },
          {
            id: 4,
            name: 'Sạc Wireless Fast',
            description: 'Sạc không dây tốc độ cao',
            price: 399000,
            discount: 20,
            discountPrice: 319200,
            finalPrice: 319200,
            stockQuantity: 25,
            quantityInStock: 25,
            mainImageUrl: 'https://via.placeholder.com/300x300/2a5298/ffffff?text=Wireless+Fast',
            detailImageUrls: [],
            imageUrls: ['https://via.placeholder.com/300x300/2a5298/ffffff?text=Wireless+Fast'],
            categoryId: 1,
            categoryName: 'Sạc điện thoại',
            isActive: true,
            isNew: false,
            isOnSale: true,
            isFeatured: true,
            averageRating: 4.9,
            reviewCount: 67,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          },
          {
            id: 5,
            name: 'Tai nghe Bluetooth',
            description: 'Tai nghe Bluetooth chất lượng cao',
            price: 599000,
            discount: 25,
            discountPrice: 449250,
            finalPrice: 449250,
            stockQuantity: 40,
            quantityInStock: 40,
            mainImageUrl: 'https://via.placeholder.com/300x300/1e3c72/ffffff?text=Bluetooth+Headphones',
            detailImageUrls: [],
            imageUrls: ['https://via.placeholder.com/300x300/1e3c72/ffffff?text=Bluetooth+Headphones'],
            categoryId: 2,
            categoryName: 'Tai nghe',
            isActive: true,
            isNew: false,
            isOnSale: true,
            isFeatured: true,
            averageRating: 4.5,
            reviewCount: 123,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          },
          {
            id: 6,
            name: 'Dây sạc Lightning',
            description: 'Dây sạc Lightning cho iPhone',
            price: 149000,
            discount: 10,
            discountPrice: 134100,
            finalPrice: 134100,
            stockQuantity: 60,
            quantityInStock: 60,
            mainImageUrl: 'https://via.placeholder.com/300x300/2a5298/ffffff?text=Lightning+Cable',
            detailImageUrls: [],
            imageUrls: ['https://via.placeholder.com/300x300/2a5298/ffffff?text=Lightning+Cable'],
            categoryId: 3,
            categoryName: 'Dây sạc',
            isActive: true,
            isNew: false,
            isOnSale: true,
            isFeatured: true,
            averageRating: 4.4,
            reviewCount: 89,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          },
          {
            id: 7,
            name: 'Sạc dự phòng 10000mAh',
            description: 'Pin dự phòng 10000mAh',
            price: 499000,
            discount: 30,
            discountPrice: 349300,
            finalPrice: 349300,
            stockQuantity: 35,
            quantityInStock: 35,
            mainImageUrl: 'https://via.placeholder.com/300x300/1e3c72/ffffff?text=Power+Bank+10000',
            detailImageUrls: [],
            imageUrls: ['https://via.placeholder.com/300x300/1e3c72/ffffff?text=Power+Bank+10000'],
            categoryId: 1,
            categoryName: 'Sạc điện thoại',
            isActive: true,
            isNew: false,
            isOnSale: true,
            isFeatured: true,
            averageRating: 4.7,
            reviewCount: 201,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          },
          {
            id: 8,
            name: 'Tai nghe có dây',
            description: 'Tai nghe có dây chất lượng cao',
            price: 299000,
            discount: 15,
            discountPrice: 254150,
            finalPrice: 254150,
            stockQuantity: 45,
            quantityInStock: 45,
            mainImageUrl: 'https://via.placeholder.com/300x300/2a5298/ffffff?text=Wired+Headphones',
            detailImageUrls: [],
            imageUrls: ['https://via.placeholder.com/300x300/2a5298/ffffff?text=Wired+Headphones'],
            categoryId: 2,
            categoryName: 'Tai nghe',
            isActive: true,
            isNew: false,
            isOnSale: true,
            isFeatured: true,
            averageRating: 4.3,
            reviewCount: 156,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          },
          {
            id: 9,
            name: 'Dây sạc USB-C 2m',
            description: 'Dây sạc USB-C dài 2m',
            price: 179000,
            discount: 20,
            discountPrice: 143200,
            finalPrice: 143200,
            stockQuantity: 55,
            quantityInStock: 55,
            mainImageUrl: 'https://via.placeholder.com/300x300/1e3c72/ffffff?text=USB-C+2m',
            detailImageUrls: [],
            imageUrls: ['https://via.placeholder.com/300x300/1e3c72/ffffff?text=USB-C+2m'],
            categoryId: 3,
            categoryName: 'Dây sạc',
            isActive: true,
            isNew: false,
            isOnSale: true,
            isFeatured: true,
            averageRating: 4.6,
            reviewCount: 98,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          }
        ];
      }
    });
  }

  shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  startSlider(): void {
    setInterval(() => {
      this.currentSlide = (this.currentSlide + 1) % this.slides.length;
    }, 3000);
  }

  goToSlide(index: number): void {
    this.currentSlide = index;
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  }

  getStars(rating: number): number[] {
    return Array(5).fill(0).map((_, i) => i < Math.floor(rating) ? 1 : 0);
  }

  getCategoryImageUrl(category: Category): string {
    return category.imageUrl || "https://via.placeholder.com/200x200/1e3c72/ffffff?text=Category";
  }

  getCategoryCount(category: Category): number {
    return category.productCount || 0;
  }

  getProductImageUrl(product: Product): string {
    return product.mainImageUrl || "https://via.placeholder.com/300x300/1e3c72/ffffff?text=Product";
  }

  getProductBadge(product: Product): string {
    if (product.isOnSale && product.discount > 0) {
      return `Giảm ${product.discount}%`;
    }
    if (product.isNew) {
      return 'Mới';
    }
    return 'Nổi bật';
  }
}
