import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Category, CategoryDto } from '../../../../models/category.model';
import { CategoryService } from '../../../../services/category.service';

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './category-form.component.html',
  styleUrls: ['./category-form.component.css']
})
export class CategoryFormComponent implements OnInit {
  @Input() category: Category | null = null;
  @Input() isVisible = false;
  @Input() mode: 'add' | 'edit' = 'add';
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<CategoryDto>();

  categoryForm!: FormGroup;
  submitted = false;
  formTitle = '';
  isUploading = false;
  uploadProgress = 0;
  
  // Image upload
  imageFile: File | null = null;
  imagePreview: string | null = null;

  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService
  ) { }

  ngOnInit(): void {
    this.initializeForm();
  }

  ngOnChanges(): void {
    this.initializeForm();
    
    if (this.isVisible) {
      this.formTitle = this.mode === 'add' ? 'Thêm danh mục mới' : 'Cập nhật danh mục';
      
      if (this.mode === 'edit' && this.category) {
        this.categoryForm.patchValue({
          name: this.category.name || '',
          description: this.category.description || '',
          imageUrl: this.category.imageUrl || ''
        });
        
        // Set image preview
        this.imagePreview = this.category.imageUrl || null;
      }
    }
  }

  private initializeForm(): void {
    this.categoryForm = this.fb.group({
      name: ['', [Validators.required]],
      description: [''],
      imageUrl: ['']
    });
    
    // Reset image data
    if (this.mode === 'add') {
      this.imageFile = null;
      this.imagePreview = null;
    }
  }

  onImageChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.imageFile = input.files[0];
      
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(this.imageFile);
    }
  }

  removeImage(): void {
    this.imageFile = null;
    this.imagePreview = null;
    this.categoryForm.get('imageUrl')?.setValue('');
  }

  async onSubmit(): Promise<void> {
    this.submitted = true;
    
    if (this.categoryForm.invalid) {
      return;
    }
    
    try {
      // Upload image if selected
      if (this.imageFile) {
        this.isUploading = true;
        this.uploadProgress = 50;
        
        const imageResult = await this.categoryService.uploadCategoryImage(this.imageFile).toPromise();
        if (imageResult) {
          this.categoryForm.get('imageUrl')?.setValue(imageResult.imageUrl);
        }
      }
      
      this.uploadProgress = 100;
      
      // Create category data
      const categoryData: CategoryDto = {
        ...this.categoryForm.value,
        id: this.category?.id || 0,
        productCount: this.category?.productCount || 0
      };
      
      // Emit to parent component
      this.save.emit(categoryData);
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Có lỗi xảy ra khi lưu danh mục. Vui lòng thử lại.');
    } finally {
      this.isUploading = false;
    }
  }

  onClose(): void {
    this.submitted = false;
    this.close.emit();
  }

  get f() { return this.categoryForm.controls; }
}