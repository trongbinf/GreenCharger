import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { QuillModule } from 'ngx-quill';
import { Product, ProductDto } from '../../../../models/product.model';
import { Category } from '../../../../models/category.model';
import { CategoryService } from '../../../../services/category.service';
import { ProductService } from '../../../../services/product.service';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, QuillModule],
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
    private categoryService: CategoryService,
    private productService: ProductService
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

      // Set existing images
      this.existingMainImage = this.product.mainImageUrl || null;
      this.existingDetailImages = this.product.detailImageUrls || [];
    }
  }


  // Image upload properties
  selectedMainImage: File | null = null;
  selectedDetailImages: File[] = [];
  mainImagePreview: string | null = null;
  detailImagePreviews: string[] = [];
  // Existing image properties
  existingMainImage: string | null = null;
  existingDetailImages: string[] = [];
  uploadingImages = false;

  // Image upload methods
  onMainImageSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedMainImage = file;
      this.previewMainImage(file);
    }
  }

  onDetailImagesSelected(event: any): void {
    const files = Array.from(event.target.files) as File[];
    this.selectedDetailImages = [...this.selectedDetailImages, ...files];
    this.previewDetailImages();
  }

  private previewMainImage(file: File): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      this.mainImagePreview = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  private previewDetailImages(): void {
    this.detailImagePreviews = [];
    this.selectedDetailImages.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.detailImagePreviews.push(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    });
  }

    removeMainImage(): void {
    this.selectedMainImage = null;
    this.mainImagePreview = null;
    this.existingMainImage = null;
  }

    removeDetailImage(index: number): void {
    if (index < this.existingDetailImages.length) {
      // Remove from existing images
      this.existingDetailImages.splice(index, 1);
    } else {
      // Remove from new previews
      const previewIndex = index - this.existingDetailImages.length;
      this.selectedDetailImages.splice(previewIndex, 1);
      this.detailImagePreviews.splice(previewIndex, 1);
    }
  }

    async uploadImages(): Promise<{mainImageUrl: string, detailImageUrls: string[]}> {
    this.uploadingImages = true;
    const result = { mainImageUrl: '', detailImageUrls: [] as string[] };

    try {
      // Upload main image if selected
      if (this.selectedMainImage) {
        const mainImageResponse = await this.productService.uploadProductImage(this.selectedMainImage).toPromise();
        result.mainImageUrl = mainImageResponse?.imageUrl || '';
      }

      // Upload detail images if selected
      if (this.selectedDetailImages.length > 0) {
        const detailImagesResponse = await this.productService.uploadDetailImages(this.selectedDetailImages).toPromise();
        if (detailImagesResponse?.imageUrls) {
          result.detailImageUrls = detailImagesResponse.imageUrls;
        }
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      throw error;
    } finally {
      this.uploadingImages = false;
    }

    return result;
  }

  
  
  
  // Getter methods for null safety
  get hasDetailImages(): boolean {
    return this.detailImagePreviews.length > 0 || 
           this.existingDetailImages.length > 0 ||
           (this.product?.detailImageUrls ? this.product.detailImageUrls.length > 0 : false);
  }

  get showDetailUploadContent(): boolean {
    return this.detailImagePreviews.length === 0 && 
           this.existingDetailImages.length === 0 &&
           (!this.product?.detailImageUrls || this.product.detailImageUrls.length === 0);
  }

  get showDetailImagesGrid(): boolean {
    return this.detailImagePreviews.length > 0 || 
           this.existingDetailImages.length > 0 ||
           (this.product?.detailImageUrls ? this.product.detailImageUrls.length > 0 : false);
  }

  get detailImageUrls(): string[] {
    return this.product?.detailImageUrls || [];
  }

  get allDetailImages(): string[] {
    return [...this.existingDetailImages, ...this.detailImagePreviews];
  }

    async onSubmit(): Promise<void> {
    if (this.productForm.valid) {
      this.loading = true;
      this.error = null;

      try {
        const formData = this.productForm.value;
        let mainImageUrl = this.existingMainImage || '';
        let detailImageUrls = [...this.existingDetailImages];

        // Upload new images if any are selected
        if (this.selectedMainImage || this.selectedDetailImages.length > 0) {
          const uploadResult = await this.uploadImages();
          if (uploadResult.mainImageUrl) {
            mainImageUrl = uploadResult.mainImageUrl;
          }
          if (uploadResult.detailImageUrls.length > 0) {
            detailImageUrls = [...detailImageUrls, ...uploadResult.detailImageUrls];
          }
        }

        // Create ProductDto
        const productDto: ProductDto = {
          id: this.product?.id || 0,
          name: formData.name || '',
          description: formData.description || '',
          price: Number(formData.price) || 0,
          discount: Number(formData.discount) || 0,
          stockQuantity: Number(formData.stockQuantity) || 0,
          quantityInStock: Number(formData.stockQuantity) || 0,
          mainImageUrl: mainImageUrl,
          detailImageUrls: detailImageUrls,
          categoryId: Number(formData.categoryId) || 0,
          isActive: formData.isActive !== undefined ? formData.isActive : true,
          isNew: formData.isNew !== undefined ? formData.isNew : false,
          isOnSale: formData.isOnSale !== undefined ? formData.isOnSale : false,
          isFeatured: formData.isFeatured !== undefined ? formData.isFeatured : false
        };

        this.save.emit(productDto);
        this.loading = false;
      } catch (error) {
        console.error('Error uploading images:', error);
        this.error = 'Lỗi khi tải ảnh lên';
        this.loading = false;
      }
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
