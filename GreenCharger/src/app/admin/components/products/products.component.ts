import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  loading = false;
  error: string | null = null;

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;

  // Modals
  showFormModal = false;
  showDetailsModal = false;
  selectedProduct: Product | null = null;
  formMode: 'create' | 'edit' = 'create';

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private message: NzMessageService
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
    this.selectedProduct = {} as Product;
    this.formMode = 'create';
    this.showFormModal = true;
  }

  onEditProduct(product: Product): void {
    this.selectedProduct = product;
    this.formMode = 'edit';
    this.showFormModal = true;
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
    this.selectedProduct = product;
    this.showDetailsModal = true;
  }

  onCopyProduct(product: Product): void {
    // Create a copy without ID to add as new
    const productCopy: Product = {
      ...product,
      id: 0, // Set to 0 as this will be a new product
      name: `${product.name} (Sao chép)`
    };
    
    this.selectedProduct = productCopy;
    this.formMode = 'create';
    this.showFormModal = true;
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

  onCloseForm(): void {
    this.showFormModal = false;
  }

  onCloseDetails(): void {
    this.showDetailsModal = false;
  }

  onSaveProduct(product: ProductDto): void {
    if (this.formMode === 'create') {
      this.productService.createProduct(product).subscribe({
        next: (newProduct: Product) => {
          this.products.unshift(newProduct);
          this.showFormModal = false;
          this.message.success('Thêm sản phẩm thành công!');
          this.loadProducts(); // Reload to get the correct product list
        },
        error: (error: any) => {
          console.error('Error adding product:', error);
          this.message.error('Lỗi khi thêm sản phẩm. Vui lòng thử lại!');
        }
      });
    } else {
      this.productService.updateProduct(product.id, product).subscribe({
        next: () => {
          this.showFormModal = false;
          this.message.success('Cập nhật sản phẩm thành công!');
          this.loadProducts(); // Reload to get the updated product data
        },
        error: (error: any) => {
          console.error('Error updating product:', error);
          this.message.error('Lỗi khi cập nhật sản phẩm. Vui lòng thử lại!');
        }
      });
    }
  }
}
