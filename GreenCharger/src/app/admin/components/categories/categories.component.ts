import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../../../services/category.service';
import { MessageService } from '../../../services/message.service';
import { Category, CategoryDto } from '../../../models/category.model';
import { CategoryDetailComponent } from './category-detail/category-detail.component';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, FormsModule, CategoryDetailComponent],
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.css', './categories.component.modal.css']
})
export class CategoriesComponent implements OnInit {
  categories: Category[] = [];
  filteredCategories: Category[] = [];
  searchTerm: string = '';
  loading = false;
  error: string | null = null;

  // Modal state
  showModal = false;
  isEditMode = false;
  selectedCategory: Category | null = null;
  showDetailModal = false;
  
  // Category form data
  categoryData: CategoryDto = {
    id: 0,
    name: '',
    description: '',
    imageUrl: '',
    productCount: 0
  };
  
  // Image handling
  imageFile: File | null = null;
  imagePreview: string | null = null;
  isUploading = false;

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;

  constructor(
    private categoryService: CategoryService,
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.loading = true;
    this.error = null;
    
    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        this.filteredCategories = categories;
        this.totalItems = categories.length;
        this.loading = false;
        console.log('Categories loaded:', categories);
      },
      error: (error) => {
        this.error = 'Không thể tải danh sách danh mục';
        this.loading = false;
        console.error('Error loading categories:', error);
        this.messageService.error('Lỗi', 'Không thể tải danh sách danh mục');
      }
    });
  }

  onSearch(): void {
    if (!this.searchTerm.trim()) {
      this.filteredCategories = this.categories;
    } else {
      this.filteredCategories = this.categories.filter(category =>
        category.name?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        category.description?.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
    this.totalItems = this.filteredCategories.length;
    this.currentPage = 1;
  }

  onAddCategory(): void {
    this.isEditMode = false;
    this.selectedCategory = null;
    this.resetCategoryData();
    this.showModal = true;
  }

  onEditCategory(category: Category): void {
    this.isEditMode = true;
    this.selectedCategory = category;
    this.categoryData = {
      id: category.id,
      name: category.name,
      description: category.description,
      imageUrl: category.imageUrl,
      productCount: category.productCount
    };
    this.imageFile = null;
    this.imagePreview = category.imageUrl || null;
    this.showModal = true;
  }

  onDeleteCategory(category: Category): void {
    this.messageService.confirm(
      'Xác nhận xóa',
      `Bạn có chắc chắn muốn xóa danh mục "${category.name}"?`,
      'Xóa',
      'Hủy'
    ).then((result) => {
      if (result.isConfirmed) {
        this.categoryService.deleteCategory(category.id).subscribe({
          next: () => {
            this.messageService.success('Thành công', 'Xóa danh mục thành công');
            this.loadCategories();
          },
          error: (error) => {
            this.error = 'Không thể xóa danh mục';
            console.error('Error deleting category:', error);
            this.messageService.error('Lỗi', 'Không thể xóa danh mục');
          }
        });
      }
    });
  }

  onViewCategory(category: Category): void {
    this.selectedCategory = category;
    this.showDetailModal = true;
  }

  onCopyCategory(category: Category): void {
    console.log('Copy category:', category);
    // TODO: Implement copy category functionality
  }

  onModalClose(): void {
    this.showModal = false;
    this.showDetailModal = false;
    this.selectedCategory = null;
    this.resetCategoryData();
  }
  
  resetCategoryData(): void {
    this.categoryData = {
      id: 0,
      name: '',
      description: '',
      imageUrl: '',
      productCount: 0
    };
    this.imageFile = null;
    this.imagePreview = null;
    this.isUploading = false;
  }

  // Pagination methods
  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  get paginatedCategories(): Category[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredCategories.slice(startIndex, endIndex);
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

  // Xử lý tải lên ảnh
  onImageChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.imageFile = input.files[0];
      this.previewImage();
    }
  }

  previewImage(): void {
    if (!this.imageFile) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = reader.result as string;
    };
    reader.readAsDataURL(this.imageFile);
  }

  removeImage(): void {
    this.imageFile = null;
    this.imagePreview = null;
    this.categoryData.imageUrl = '';
  }

  // FIXED: Use combined endpoints for better image handling
  onModalSave(): void {
    if (!this.validateCategoryForm()) {
      this.messageService.warning('Cảnh báo', 'Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    this.isUploading = true;

    if (this.isEditMode && this.selectedCategory) {
      // Cập nhật danh mục hiện có
      this.updateCategoryWithImage();
    } else {
      // Tạo danh mục mới
      this.createCategoryWithImage();
    }
  }

  // FIXED: Create category with image in one call
  createCategoryWithImage(): void {
    console.log('Creating new category with image');
    
    const payload = {
      name: this.categoryData.name,
      description: this.categoryData.description,
      file: this.imageFile
    };

    this.categoryService.createCategoryWithImage(payload).subscribe({
      next: (response) => {
        console.log('Category created successfully:', response);
        this.messageService.success('Thành công', 'Thêm danh mục thành công');
        this.isUploading = false;
        this.onModalClose();
        this.loadCategories();
      },
      error: (error) => {
        this.error = 'Không thể tạo danh mục mới';
        console.error('Error creating category:', error);
        this.messageService.error('Lỗi', 'Không thể tạo danh mục mới');
        this.isUploading = false;
      }
    });
  }

  // FIXED: Update category with image in one call
  updateCategoryWithImage(): void {
    if (!this.selectedCategory) return;
    
    console.log('Updating category with ID:', this.selectedCategory.id);
    
    const payload = {
      name: this.categoryData.name,
      description: this.categoryData.description,
      file: this.imageFile
    };

    this.categoryService.updateCategoryWithImage(this.selectedCategory.id, payload).subscribe({
      next: (response) => {
        console.log('Category updated successfully:', response);
        this.messageService.success('Thành công', 'Cập nhật danh mục thành công');
        this.isUploading = false;
        this.onModalClose();
        this.loadCategories();
      },
      error: (error) => {
        this.error = 'Không thể cập nhật danh mục';
        console.error('Error updating category:', error);
        this.messageService.error('Lỗi', 'Không thể cập nhật danh mục');
        this.isUploading = false;
      }
    });
  }

  validateCategoryForm(): boolean {
    return !!this.categoryData.name;
  }
}
// CI/CD Test - Category update fixes applied
