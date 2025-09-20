import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../../services/category.service';
import { Category, CategoryDto } from '../../interfaces/category.interface';

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
    this.showModal = true;
  }

  onEditCategory(category: Category): void {
    this.isEditMode = true;
    this.selectedCategory = category;
    this.showModal = true;
  }

  onDeleteCategory(category: Category): void {
    if (confirm(`Bạn có chắc chắn muốn xóa danh mục "${category.name}"?`)) {
      this.categoryService.deleteCategory(category.id).subscribe({
        next: () => {
          this.loadCategories();
        },
        error: (error) => {
          this.error = 'Không thể xóa danh mục';
          console.error('Error deleting category:', error);
        }
      });
    }
  }

  onViewCategory(category: Category): void {
    console.log('View category:', category);
  }

  onModalClose(): void {
    this.showModal = false;
    this.selectedCategory = null;
  }

  onModalSave(categoryData: CategoryDto): void {
    if (this.isEditMode && this.selectedCategory) {
      // Update existing category
      this.categoryService.updateCategory(this.selectedCategory.id, categoryData).subscribe({
        next: () => {
          this.loadCategories();
          this.onModalClose();
        },
        error: (error) => {
          this.error = 'Không thể cập nhật danh mục';
          console.error('Error updating category:', error);
        }
      });
    } else {
      // Create new category
      this.categoryService.createCategory(categoryData).subscribe({
        next: () => {
          this.loadCategories();
          this.onModalClose();
        },
        error: (error) => {
          this.error = 'Không thể tạo danh mục mới';
          console.error('Error creating category:', error);
        }
      });
    }
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
}
