import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ProductService } from '../../../services/product.service';
import { CategoryService } from '../../../services/category.service';
import { ProductDto } from '../../../models/product.model';
import { CategoryDto } from '../../../models/category.model';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css']
})
export class ProductListComponent implements OnInit {
  products: ProductDto[] = [];
  categories: CategoryDto[] = [];
  filteredProducts: ProductDto[] = [];
  
  // Filters
  selectedCategoryId: number | null = null;
  searchKeyword: string = '';
  
  // Pagination
  currentPage: number = 1;
  pageSize: number = 10;
  totalItems: number = 0;
  
  // Loading state
  loading: boolean = false;
  error: string | null = null;

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading = true;
    this.error = null;
    
    this.productService.getAllProducts().subscribe({
      next: (data) => {
        this.products = data;
        this.filteredProducts = data;
        this.totalItems = data.length;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Không thể tải danh sách sản phẩm';
        this.loading = false;
        console.error('Error loading products:', error);
      }
    });
  }

  loadCategories(): void {
    this.categoryService.getAllCategories().subscribe({
      next: (data) => {
        this.categories = data;
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });
  }

  onSearchChange(keyword: string): void {
    this.searchKeyword = keyword;
    this.applyFilters();
  }

  onCategoryChange(categoryId: number | null): void {
    this.selectedCategoryId = categoryId;
    this.applyFilters();
  }

  applyFilters(): void {
    let filtered = this.products;

    // Filter by keyword
    if (this.searchKeyword) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(this.searchKeyword.toLowerCase()) ||
        product.description.toLowerCase().includes(this.searchKeyword.toLowerCase())
      );
    }

    // Filter by category
    if (this.selectedCategoryId) {
      filtered = filtered.filter(product => product.categoryId === this.selectedCategoryId);
    }

    this.filteredProducts = filtered;
    this.totalItems = filtered.length;
    this.currentPage = 1; // Reset to first page when filtering
  }

  deleteProduct(id: number): void {
    if (confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
      this.productService.deleteProduct(id).subscribe({
        next: () => {
          this.loadProducts(); // Reload list after deletion
        },
        error: (error) => {
          this.error = 'Không thể xóa sản phẩm';
          console.error('Error deleting product:', error);
        }
      });
    }
  }

  editProduct(id: number): void {
    this.router.navigate(['/products/edit', id]);
  }

  addNewProduct(): void {
    this.router.navigate(['/products/new']);
  }

  // Pagination methods
  get totalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize);
  }

  get paginatedProducts(): ProductDto[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredProducts.slice(startIndex, startIndex + this.pageSize);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  getCategoryName(categoryId: number): string {
    const category = this.categories.find(c => c.id === categoryId);
    return category ? category.name : 'Không xác định';
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  }
}
