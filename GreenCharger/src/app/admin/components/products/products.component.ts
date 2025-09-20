import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { CategoryService } from '../../services/category.service';
import { Product, ProductDto } from '../../interfaces/product.interface';
import { Category } from '../../interfaces/category.interface';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css']
})
export class ProductsComponent implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  categories: Category[] = [];
  searchTerm: string = '';
  selectedCategory: number | string = '';
  selectedStatus: string = '';
  loading = false;
  error: string | null = null;

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService
  ) { }

  ngOnInit(): void {
  // Hiển thị mặc định tất cả filter
  this.selectedCategory = '';
  this.selectedStatus = '';
  this.loadProducts();
  this.loadCategories();
  }

  loadProducts(): void {
    this.loading = true;
    this.error = null;
    
    this.productService.getProducts().subscribe({
      next: (products) => {
        this.products = products;
        this.filteredProducts = products;
        this.totalItems = products.length;
        this.loading = false;
        console.log('Products loaded:', products);
      },
      error: (error) => {
        this.error = 'Không thể tải danh sách sản phẩm';
        this.loading = false;
        console.error('Error loading products:', error);
      }
    });
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });
  }

  onSearch(): void {
    this.applyFilters();
  }

  onCategoryChange(): void {
    this.applyFilters();
  }

  onStatusChange(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    let filtered = [...this.products];

    // Search filter
    if (this.searchTerm.trim()) {
      filtered = filtered.filter(product =>
        product.name?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        product.categoryName?.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (this.selectedCategory !== '' && this.selectedCategory !== null) {
      filtered = filtered.filter(product => product.categoryId === this.selectedCategory);
    }

    // Status filter
    if (this.selectedStatus !== '' && this.selectedStatus !== null) {
      filtered = filtered.filter(product => 
        this.selectedStatus === 'active' ? product.isActive : !product.isActive
      );
    }

    this.filteredProducts = filtered;
    this.totalItems = filtered.length;
    this.currentPage = 1;
  }

  onAddProduct(): void {
    console.log('Add product');
  }

  onEditProduct(product: Product): void {
    console.log('Edit product:', product);
  }

  onDeleteProduct(product: Product): void {
    if (confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${product.name}"?`)) {
      this.productService.deleteProduct(product.id).subscribe({
        next: () => {
          this.loadProducts();
        },
        error: (error) => {
          this.error = 'Không thể xóa sản phẩm';
          console.error('Error deleting product:', error);
        }
      });
    }
  }

  onViewProduct(product: Product): void {
    console.log('View product:', product);
  }

  onCopyProduct(product: Product): void {
    console.log('Copy product:', product);
    // TODO: Implement copy product functionality
  }

  onToggleStatus(product: Product): void {
    this.productService.updateProductStatus(product.id, !product.isActive).subscribe({
      next: () => {
        this.loadProducts();
      },
      error: (error) => {
        this.error = 'Không thể cập nhật trạng thái sản phẩm';
        console.error('Error updating product status:', error);
      }
    });
  }

  clearFilters(): void {
    this.searchTerm = '';
  this.selectedCategory = '';
  this.selectedStatus = '';
    this.applyFilters();
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  }

  // Pagination methods
  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  get paginatedProducts(): Product[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredProducts.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  changeItemsPerPage(items: number): void {
    this.itemsPerPage = items;
    this.currentPage = 1;
  }
}
