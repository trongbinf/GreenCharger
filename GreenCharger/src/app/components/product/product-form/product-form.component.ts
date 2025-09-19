import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../../services/product.service';
import { CategoryService } from '../../../services/category.service';
import { Product } from '../../../models/product.model';
import { CategoryDto } from '../../../models/category.model';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.css']
})
export class ProductFormComponent implements OnInit {
  productForm: FormGroup;
  categories: CategoryDto[] = [];
  isEditMode = false;
  productId: number | null = null;
  loading = false;
  error: string | null = null;
  selectedFiles: File[] = [];

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private categoryService: CategoryService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.productForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadCategories();
    
    // Check if we're in edit mode
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.productId = +id;
        this.loadProduct(this.productId);
      }
    });
  }

  createForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      price: [0, [Validators.required, Validators.min(0)]],
      discount: [0, [Validators.min(0), Validators.max(100)]],
      stockQuantity: [0, [Validators.required, Validators.min(0)]],
      categoryId: [null, [Validators.required]],
      isActive: [true],
      mainImageUrl: [''],
      detailImageUrls: [[]]
    });
  }

  loadCategories(): void {
    this.categoryService.getAllCategories().subscribe({
      next: (data) => {
        this.categories = data;
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });
  }

  loadProduct(id: number): void {
    this.loading = true;
    this.productService.getProductById(id).subscribe({
      next: (product) => {
        this.productForm.patchValue({
          name: product.name,
          description: product.description,
          price: product.price,
          discount: product.discount || 0,
          stockQuantity: product.stockQuantity,
          categoryId: product.categoryId,
          isActive: product.isActive,
          mainImageUrl: product.mainImageUrl || '',
          detailImageUrls: product.detailImageUrls || []
        });
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Không thể tải thông tin sản phẩm';
        this.loading = false;
        console.error('Error loading product:', error);
      }
    });
  }

  onFileSelect(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.selectedFiles = Array.from(files);
    }
  }

  onSubmit(): void {
    if (this.productForm.valid) {
      this.loading = true;
      this.error = null;

      const formValue = this.productForm.value;
      const productData: Product = {
        id: this.productId || 0,
        name: formValue.name,
        description: formValue.description,
        price: formValue.price,
        discount: formValue.discount,
        stockQuantity: formValue.stockQuantity,
        categoryId: formValue.categoryId,
        isActive: formValue.isActive,
        mainImageUrl: formValue.mainImageUrl,
        detailImageUrls: formValue.detailImageUrls,
        orderDetails: []
      };

      const operation = this.isEditMode 
        ? this.productService.updateProduct(this.productId!, productData)
        : this.productService.createProduct(productData);

      operation.subscribe({
        next: (result) => {
          this.loading = false;
          
          // Handle image upload if files selected
          if (this.selectedFiles.length > 0 && result.id) {
            this.uploadImages(result.id);
          } else {
            this.router.navigate(['/products']);
          }
        },
        error: (error) => {
          this.error = this.isEditMode 
            ? 'Không thể cập nhật sản phẩm' 
            : 'Không thể tạo sản phẩm mới';
          this.loading = false;
          console.error('Error saving product:', error);
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  uploadImages(productId: number): void {
    if (this.selectedFiles.length > 0) {
      // Upload main image (first file)
      this.productService.uploadProductImage(productId, this.selectedFiles[0]).subscribe({
        next: () => {
          this.router.navigate(['/products']);
        },
        error: (error) => {
          console.error('Error uploading image:', error);
          // Still navigate even if image upload fails
          this.router.navigate(['/products']);
        }
      });
    }
  }

  markFormGroupTouched(): void {
    Object.keys(this.productForm.controls).forEach(key => {
      this.productForm.get(key)?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string | null {
    const field = this.productForm.get(fieldName);
    if (field && field.touched && field.errors) {
      if (field.errors['required']) {
        return 'Trường này là bắt buộc';
      }
      if (field.errors['minlength']) {
        const requiredLength = field.errors['minlength'].requiredLength;
        return `Tối thiểu ${requiredLength} ký tự`;
      }
      if (field.errors['min']) {
        return 'Giá trị phải lớn hơn hoặc bằng 0';
      }
      if (field.errors['max']) {
        return 'Giá trị không được vượt quá 100';
      }
    }
    return null;
  }

  onCancel(): void {
    this.router.navigate(['/products']);
  }
}
