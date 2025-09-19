import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CategoryService } from '../../../services/category.service';
import { CategoryDto, CreateCategoryDto, UpdateCategoryDto } from '../../../models/category.model';

@Component({
  selector: 'app-category-management',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './category-management.component.html',
  styleUrl: './category-management.component.css'
})
export class CategoryManagementComponent implements OnInit {
  categories: CategoryDto[] = [];
  filteredCategories: CategoryDto[] = [];
  
  categoryForm: FormGroup;
  editingCategory: CategoryDto | null = null;
  showForm = false;
  loading = false;
  
  searchTerm = '';
  filterStatus: boolean | undefined = undefined;

  constructor(
    private categoryService: CategoryService,
    private fb: FormBuilder
  ) {
    this.categoryForm = this.createForm();
  }

  ngOnInit() {
    this.loadCategories();
  }

  createForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: ['', [Validators.required]],
      isActive: [true]
    });
  }

  loadCategories() {
    this.loading = true;
    this.categoryService.getCategories(this.searchTerm, this.filterStatus)
      .subscribe({
        next: (data) => {
          this.categories = data;
          this.filteredCategories = data;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading categories:', error);
          this.loading = false;
        }
      });
  }

  showCreateForm() {
    this.editingCategory = null;
    this.categoryForm.reset();
    this.categoryForm.patchValue({
      isActive: true
    });
    this.showForm = true;
  }

  editCategory(category: CategoryDto) {
    this.editingCategory = category;
    this.categoryForm.patchValue({
      name: category.name,
      description: category.description,
      isActive: category.isActive
    });
    this.showForm = true;
  }

  saveCategory() {
    if (this.categoryForm.valid) {
      const formValue = this.categoryForm.value;
      
      if (this.editingCategory) {
        const updateDto: UpdateCategoryDto = {
          name: formValue.name,
          description: formValue.description,
          isActive: formValue.isActive
        };

        this.categoryService.updateCategory(this.editingCategory.id, updateDto).subscribe({
          next: () => {
            this.loadCategories();
            this.showForm = false;
          },
          error: (error) => console.error('Error updating category:', error)
        });
      } else {
        const createDto: CreateCategoryDto = {
          name: formValue.name,
          description: formValue.description,
          isActive: formValue.isActive
        };

        this.categoryService.createCategory(createDto).subscribe({
          next: () => {
            this.loadCategories();
            this.showForm = false;
          },
          error: (error) => console.error('Error creating category:', error)
        });
      }
    }
  }

  toggleCategoryStatus(category: CategoryDto) {
    this.categoryService.toggleStatus(category.id).subscribe({
      next: () => {
        this.loadCategories();
      },
      error: (error) => console.error('Error toggling category status:', error)
    });
  }

  deleteCategory(category: CategoryDto) {
    if (confirm(`Bạn có chắc muốn xóa danh mục "${category.name}"? Điều này có thể ảnh hưởng đến ${category.productCount} sản phẩm.`)) {
      this.categoryService.deleteCategory(category.id).subscribe({
        next: () => {
          this.loadCategories();
        },
        error: (error) => console.error('Error deleting category:', error)
      });
    }
  }

  applyFilters() {
    this.loadCategories();
  }

  clearFilters() {
    this.searchTerm = '';
    this.filterStatus = undefined;
    this.loadCategories();
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('vi-VN');
  }
}
