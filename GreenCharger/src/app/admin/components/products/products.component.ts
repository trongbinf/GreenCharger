import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ProductService } from '../../../services/product.service';
import { CategoryService } from '../../../services/category.service';
import { Product, ProductDto } from '../../../models/product.model';
import { Category } from '../../../models/category.model';
import { NzMessageModule, NzMessageService } from 'ng-zorro-antd/message';
import { ProductFormComponent } from './product-form/product-form.component';
import { ProductDetailsComponent } from './product-details/product-details.component';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    NzMessageModule,
    ProductFormComponent,
    ProductDetailsComponent
  ],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css', './products.component.modal.css']
})
export class ProductsComponent implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  categories: Category[] = [];
  searchTerm: string = '';
  selectedCategory: number | string = '';
  selectedStatus: string = '';
  sortBy: string = 'name';
  sortOrder: 'asc' | 'desc' = 'asc';
  showForm = false;
  showDetails = false;
  showFormModal = false;
  showDetailsModal = false;
  selectedProduct: Product | null = null;
  isEditing = false;
  formMode: 'create' | 'edit' = 'create';
  loading = false;
  error: string = '';
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private message: NzMessageService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.loadProducts();
    this.loadCategories();
  }

  // Sanitize HTML content
  getSafeHtml(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  loadProducts(): void {
    this.loading = true;
    this.error = '';
    this.productService.getProducts().subscribe({
      next: (products) => {
        this.products = products;
        this.filteredProducts = [...products];
        this.totalItems = products.length;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.error = 'Lỗi khi tải danh sách sản phẩm';
        this.loading = false;
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
        this.message.error('Lỗi khi tải danh mục');
      }
    });
  }

  onSearch(): void {
    this.filterProducts();
  }

  onCategoryChange(): void {
    this.filterProducts();
  }

  onStatusChange(): void {
    this.filterProducts();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedCategory = '';
    this.selectedStatus = '';
    this.filterProducts();
  }

  filterProducts(): void {
    let filtered = [...this.products];

    // Filter by search term
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(term) ||
        product.description.toLowerCase().includes(term) ||
        product.categoryName.toLowerCase().includes(term)
      );
    }

    // Filter by category
    if (this.selectedCategory && this.selectedCategory !== '') {
      filtered = filtered.filter(product => product.categoryId === Number(this.selectedCategory));
    }

    // Filter by status
    if (this.selectedStatus && this.selectedStatus !== '') {
      const isActive = this.selectedStatus === 'active';
      filtered = filtered.filter(product => product.isActive === isActive);
    }

    this.filteredProducts = filtered;
    this.totalItems = filtered.length;
    this.currentPage = 1;
  }

  onSort(column: string): void {
    if (this.sortBy === column) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = column;
      this.sortOrder = 'asc';
    }

    this.filteredProducts.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (column) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'category':
          aValue = a.categoryName.toLowerCase();
          bValue = b.categoryName.toLowerCase();
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return this.sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return this.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }

  onAddProduct(): void {
    this.selectedProduct = null;
    this.isEditing = false;
    this.formMode = 'create';
    this.showForm = true;
    this.showFormModal = true;
  }

  onEditProduct(product: Product): void {
    this.selectedProduct = product;
    this.isEditing = true;
    this.formMode = 'edit';
    this.showForm = true;
    this.showFormModal = true;
  }

  onViewProduct(product: Product): void {
    this.selectedProduct = product;
    this.showDetails = true;
    this.showDetailsModal = true;
  }

  onDeleteProduct(product: Product): void {
    if (confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${product.name}"?`)) {
      this.productService.deleteProduct(product.id).subscribe({
        next: () => {
          this.message.success('Xóa sản phẩm thành công');
          this.loadProducts();
        },
        error: (error) => {
          console.error('Error deleting product:', error);
          this.message.error('Lỗi khi xóa sản phẩm');
        }
      });
    }
  }

  onToggleStatus(product: Product): void {
    const newStatus = !product.isActive;
    this.productService.updateProductStatus(product.id, newStatus).subscribe({
      next: () => {
        product.isActive = newStatus;
        this.message.success(`Sản phẩm đã ${newStatus ? 'kích hoạt' : 'vô hiệu hóa'}`);
      },
      error: (error) => {
        console.error('Error updating product status:', error);
        this.message.error('Lỗi khi cập nhật trạng thái sản phẩm');
      }
    });
  }

  onCloseForm(): void {
    this.showForm = false;
    this.showFormModal = false;
    this.selectedProduct = null;
    this.isEditing = false;
  }

  onSaveProduct(product: ProductDto): void {
    this.loading = true;
    this.error = '';
    
    if (this.formMode === 'create') {
      this.productService.createProduct(product).subscribe({
        next: (createdProduct) => {
          this.message.success('Thêm sản phẩm thành công');
          this.closeModalAndReload();
        },
        error: (error) => {
          console.error('Error creating product:', error);
          this.error = 'Lỗi khi thêm sản phẩm';
          this.message.error('Lỗi khi thêm sản phẩm');
          this.loading = false;
        }
      });
    } else {
      this.productService.updateProduct(product.id, product).subscribe({
        next: (updatedProduct) => {
          this.message.success('Cập nhật sản phẩm thành công');
          this.closeModalAndReload();
        },
        error: (error) => {
          console.error('Error updating product:', error);
          this.error = 'Lỗi khi cập nhật sản phẩm';
          this.message.error('Lỗi khi cập nhật sản phẩm');
          this.loading = false;
        }
      });
    }
  }

  private closeModalAndReload(): void {
    // Close modal
    this.showForm = false;
    this.showFormModal = false;
    this.selectedProduct = null;
    this.isEditing = false;
    this.loading = false;
    this.error = '';
    
    // Reload products
    this.loadProducts();
  }

  onCloseDetails(): void {
    this.showDetails = false;
    this.showDetailsModal = false;
    this.selectedProduct = null;
  }

  getStatusClass(isActive: boolean): string {
    return isActive ? 'status-active' : 'status-inactive';
  }

  getStatusText(isActive: boolean): string {
    return isActive ? 'Hoạt động' : 'Không hoạt động';
  }

  getStatusIcon(isActive: boolean): string {
    return isActive ? 'fa-check-circle' : 'fa-times-circle';
  }

  getStatusColor(isActive: boolean): string {
    return isActive ? '#28a745' : '#dc3545';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  }

  getTotalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  getPageNumbers(): number[] {
    const totalPages = this.getTotalPages();
    const pages: number[] = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  onPageChange(page: number): void {
    this.currentPage = page;
  }

  goToPage(page: number): void {
    this.currentPage = page;
  }

  onPageSizeChange(size: number): void {
    this.itemsPerPage = size;
    this.currentPage = 1;
  }

  changeItemsPerPage(size: number): void {
    this.itemsPerPage = size;
    this.currentPage = 1;
  }

  getPaginatedProducts(): Product[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredProducts.slice(startIndex, endIndex);
  }

  get paginatedProducts(): Product[] {
    return this.getPaginatedProducts();
  }

  get totalPages(): number {
    return this.getTotalPages();
  }
}