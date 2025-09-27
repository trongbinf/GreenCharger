import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { QuillModule } from 'ngx-quill';
import { Product, ProductDto } from '../../../../models/product.model';
import { Category } from '../../../../models/category.model';
import { CategoryService } from '../../../../services/category.service';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, QuillModule],
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.css', './product-form.component.modal.css']
})
export class ProductFormComponent implements OnInit {
  @Input() product: Product | null = null;
  @Input() isVisible = false;
  @Input() mode: 'create' | 'edit' = 'create';
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<ProductDto>();

  productForm!: FormGroup;
  categories: Category[] = [];
  loading = false;
  error: string | null = null;
  selectedImages: File[] = [];
  imagePreviewUrls: string[] = [];

  // Quill editor configuration
  quillConfig = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      ['blockquote', 'code-block'],
      [{ 'header': 1 }, { 'header': 2 }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'direction': 'rtl' }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'font': [] }],
      [{ 'align': [] }],
      ['clean'],
      ['link', 'image']
    ]
  };

  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadCategories();
    
    if (this.product && this.mode === 'edit') {
      this.loadProductData();
    }
  }

  private initForm(): void {
    this.productForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      price: [0, [Validators.required, Validators.min(0)]],
      discount: [0, [Validators.min(0), Validators.max(100)]],
      stockQuantity: [0, [Validators.required, Validators.min(0)]],
      categoryId: [0, [Validators.required, Validators.min(1)]],
      isActive: [true],
      isNew: [false],
      isOnSale: [false],
      isFeatured: [false]
    });
  }

  private loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.error = 'Không thể tải danh mục';
      }
    });
  }

  private loadProductData(): void {
    if (this.product) {
      this.productForm.patchValue({
        name: this.product.name,
        description: this.product.description,
        price: this.product.price,
        discount: this.product.discount,
        stockQuantity: this.product.stockQuantity,
        categoryId: this.product.categoryId,
        isActive: this.product.isActive,
        isNew: this.product.isNew,
        isOnSale: this.product.isOnSale,
        isFeatured: this.product.isFeatured
      });
    }
  }

  onImageSelected(event: any): void {
    const files = Array.from(event.target.files) as File[];
    this.selectedImages = [...this.selectedImages, ...files];
    this.updateImagePreviews();
  }

  removeImage(index: number): void {
    this.selectedImages.splice(index, 1);
    this.updateImagePreviews();
  }

  private updateImagePreviews(): void {
    this.imagePreviewUrls = [];
    this.selectedImages.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreviewUrls.push(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    });
  }

  onSubmit(): void {
    if (this.productForm.valid) {
      this.loading = true;
      this.error = null;

      const formData = this.productForm.value;

      // Create ProductDto for emission
      const productDto: ProductDto = {
        id: this.product?.id || 0,
        name: formData.name || '',
        description: formData.description || '',
        price: Number(formData.price) || 0,
        discount: Number(formData.discount) || 0,
        stockQuantity: Number(formData.stockQuantity) || 0,
        quantityInStock: Number(formData.stockQuantity) || 0, // Ensure this is present
        categoryId: Number(formData.categoryId) || 0,
        isActive: formData.isActive !== undefined ? formData.isActive : true,
        isNew: formData.isNew !== undefined ? formData.isNew : false,
        isOnSale: formData.isOnSale !== undefined ? formData.isOnSale : false,
        isFeatured: formData.isFeatured !== undefined ? formData.isFeatured : false
      };

      this.save.emit(productDto);
      this.loading = false;
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.productForm.controls).forEach(key => {
      const control = this.productForm.get(key);
      control?.markAsTouched();
    });
  }

  onClose(): void {
    this.close.emit();
  }

  getFieldError(fieldName: string): string {
    const field = this.productForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return `${this.getFieldLabel(fieldName)} là bắt buộc`;
      }
      if (field.errors['minlength']) {
        return `${this.getFieldLabel(fieldName)} phải có ít nhất ${field.errors['minlength'].requiredLength} ký tự`;
      }
      if (field.errors['min']) {
        return `${this.getFieldLabel(fieldName)} phải lớn hơn hoặc bằng ${field.errors['min'].min}`;
      }
      if (field.errors['max']) {
        return `${this.getFieldLabel(fieldName)} phải nhỏ hơn hoặc bằng ${field.errors['max'].max}`;
      }
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      'name': 'Tên sản phẩm',
      'description': 'Mô tả',
      'price': 'Giá',
      'discount': 'Giảm giá',
      'stockQuantity': 'Số lượng',
      'categoryId': 'Danh mục'
    };
    return labels[fieldName] || fieldName;
  }
}
