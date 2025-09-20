import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../../services/category.service';
import { Category, CategoryDto } from '../../models/category.model';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.css']
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

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;

  constructor(private categoryService: CategoryService) { }

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
    this.imagePreview = null;
    this.showModal = true;
  }

  onDeleteCategory(category: Category): void {
    if (confirm(`Bạn có chắc chắn muốn xóa danh mục "${category.name}"?`)) {
      this.categoryService.deleteCategory(category.id).subscribe({
        next: () => {
          alert('Xóa danh mục thành công');
          this.loadCategories();
        },
        error: (error) => {
          this.error = 'Không thể xóa danh mục';
          console.error('Error deleting category:', error);
          alert('Xóa danh mục thất bại: ' + error.message);
        }
      });
    }
  }

  onViewCategory(category: Category): void {
    this.selectedCategory = category;
    this.categoryData = {
      id: category.id,
      name: category.name,
      description: category.description,
      imageUrl: category.imageUrl,
      productCount: category.productCount
    };
    this.isEditMode = false;
    // Hiển thị modal xem chi tiết - có thể tạo modal view riêng sau này
    this.showModal = true;
  }

  onCopyCategory(category: Category): void {
    console.log('Copy category:', category);
    // TODO: Implement copy category functionality
  }

  onModalClose(): void {
    this.showModal = false;
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
  }

  // Phương thức này được thay thế bởi các hàm mới

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

  onModalSave(): void {
    if (!this.validateCategoryForm()) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    if (this.imageFile) {
      // Tải lên ảnh mới nếu có
      this.uploadImageAndSaveCategory();
    } else {
      // Lưu danh mục nếu không có ảnh mới
      this.saveCategory();
    }
  }

  uploadImageAndSaveCategory(): void {
    if (!this.imageFile) {
      this.saveCategory();
      return;
    }

    this.categoryService.uploadCategoryImage(this.imageFile).subscribe({
      next: (response) => {
        this.categoryData.imageUrl = response.imageUrl;
        this.saveCategory();
      },
      error: (error) => {
        console.error('Error uploading image:', error);
        alert('Không thể tải lên ảnh danh mục');
        // Vẫn tiếp tục lưu danh mục
        this.saveCategory();
      }
    });
  }

  saveCategory(): void {
    if (this.isEditMode && this.selectedCategory) {
      // Cập nhật danh mục hiện có
      this.categoryService.updateCategory(this.selectedCategory.id, this.categoryData).subscribe({
        next: () => {
          alert('Cập nhật danh mục thành công');
          this.onModalClose();
          this.loadCategories();
        },
        error: (error) => {
          this.error = 'Không thể cập nhật danh mục';
          console.error('Error updating category:', error);
          alert('Cập nhật danh mục thất bại: ' + error.message);
        }
      });
    } else {
      // Tạo danh mục mới
      this.categoryService.createCategory(this.categoryData).subscribe({
        next: () => {
          alert('Thêm danh mục thành công');
          this.onModalClose();
          this.loadCategories();
        },
        error: (error) => {
          this.error = 'Không thể tạo danh mục mới';
          console.error('Error creating category:', error);
          alert('Thêm danh mục thất bại: ' + error.message);
        }
      });
    }
  }

  validateCategoryForm(): boolean {
    return !!this.categoryData.name;
  }
}
