import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Product, ProductDto } from '../../../../models/product.model';
import { Category } from '../../../../models/category.model';
import { CategoryService } from '../../../../services/category.service';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.css']
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

  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadCategories();
    
    if (this.product && this.mode === 'edit') {
      this.populateForm(this.product);
    }
  }

  initForm(): void {
    this.productForm = this.fb.group({
      name: ['', [Validators.required]],
      description: ['', [Validators.required]],
      price: [0, [Validators.required, Validators.min(0)]],
      discountPrice: [0, [Validators.min(0)]],
      categoryId: ['', [Validators.required]],
      quantityInStock: [0, [Validators.required, Validators.min(0)]],
      isActive: [true],
      isNew: [false],
      isOnSale: [false],
      isFeatured: [false]
    });
  }

  populateForm(product: Product): void {
    this.productForm.patchValue({
      name: product.name,
      description: product.description,
      price: product.price,
      discountPrice: product.discountPrice,
      categoryId: product.categoryId,
      quantityInStock: product.quantityInStock,
      isActive: product.isActive,
      isNew: product.isNew,
      isOnSale: product.isOnSale,
      isFeatured: product.isFeatured
    });
    
    // If there are images, show their previews
    if (product.imageUrls && product.imageUrls.length > 0) {
      this.imagePreviewUrls = product.imageUrls;
    } else if (product.detailImageUrls && product.detailImageUrls.length > 0) {
      this.imagePreviewUrls = product.detailImageUrls;
    } else if (product.mainImageUrl) {
      this.imagePreviewUrls = [product.mainImageUrl];
    }
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (error) => {
        this.error = 'Không thể tải danh mục sản phẩm';
        console.error('Error loading categories:', error);
      }
    });
  }

  onImagesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    this.selectedImages = Array.from(input.files);
    this.imagePreviewUrls = [];

    // Create preview URLs for selected images
    this.selectedImages.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreviewUrls.push(e.target.result);
      };
      reader.readAsDataURL(file);
    });
  }

  removeImage(index: number): void {
    // Remove from both arrays
    this.imagePreviewUrls.splice(index, 1);
    if (this.selectedImages.length > index) {
      this.selectedImages.splice(index, 1);
    }
  }

  onSubmit(): void {
    if (this.productForm.invalid) {
      this.markFormGroupTouched(this.productForm);
      return;
    }

    // Create a product data object with the form values
    const productData: ProductDto = {
      ...this.productForm.value,
      id: this.product?.id || 0
    };
    
    // Add image URLs if they exist
    if (this.imagePreviewUrls.length > 0) {
      productData.imageUrls = this.imagePreviewUrls;
      
      // Set the main image to the first image
      if (this.imagePreviewUrls.length > 0) {
        productData.mainImageUrl = this.imagePreviewUrls[0];
      }
      
      // Set detail images if more than one image
      if (this.imagePreviewUrls.length > 1) {
        productData.detailImageUrls = this.imagePreviewUrls.slice(1);
      }
    }

    this.save.emit(productData);
  }

  onClose(): void {
    this.close.emit();
    this.productForm.reset();
    this.imagePreviewUrls = [];
    this.selectedImages = [];
    this.error = null;
  }

  // Helper to mark all form controls as touched
  markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}