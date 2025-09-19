import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CouponService } from '../../../services/coupon.service';
import { CategoryService } from '../../../services/category.service';  
import { ProductService } from '../../../services/product.service';
import { CouponDto, CreateCouponDto, UpdateCouponDto, CouponType, CouponStatisticsDto } from '../../../models/coupon.model';

@Component({
  selector: 'app-coupon-management',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './coupon-management.component.html',
  styleUrl: './coupon-management.component.css'
})
export class CouponManagementComponent implements OnInit {
  coupons: CouponDto[] = [];
  statistics: CouponStatisticsDto | null = null;
  categories: any[] = [];
  products: any[] = [];
  
  couponForm: FormGroup;
  editingCoupon: CouponDto | null = null;
  showForm = false;
  loading = false;
  
  CouponType = CouponType;
  
  searchTerm = '';
  filterActive: boolean | undefined = undefined;
  filterPublic: boolean | undefined = undefined;

  constructor(
    private couponService: CouponService,
    private categoryService: CategoryService,
    private productService: ProductService,
    private fb: FormBuilder
  ) {
    this.couponForm = this.createForm();
  }

  ngOnInit() {
    this.loadCoupons();
    this.loadStatistics();
    this.loadCategories();
    this.loadProducts();
  }

  createForm(): FormGroup {
    return this.fb.group({
      code: ['', [Validators.required, Validators.minLength(3)]],
      name: ['', [Validators.required]],
      description: [''],
      type: [CouponType.Percentage, [Validators.required]],
      value: [0, [Validators.required, Validators.min(0)]],
      minOrderAmount: [null],
      maxDiscountAmount: [null],
      startDate: ['', [Validators.required]],
      endDate: ['', [Validators.required]],
      maxUsageCount: [1, [Validators.required, Validators.min(1)]],
      maxUsagePerUser: [1, [Validators.required, Validators.min(1)]],
      isActive: [true],
      isPublic: [true],
      categoryId: [null],
      productId: [null]
    });
  }

  loadCoupons() {
    this.loading = true;
    this.couponService.getCoupons(this.filterActive, this.filterPublic, this.searchTerm)
      .subscribe({
        next: (data) => {
          this.coupons = data;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading coupons:', error);
          this.loading = false;
        }
      });
  }

  loadStatistics() {
    this.couponService.getStatistics().subscribe({
      next: (stats) => this.statistics = stats,
      error: (error) => console.error('Error loading statistics:', error)
    });
  }

  loadCategories() {
    this.categoryService.getCategories().subscribe({
      next: (data) => this.categories = data,
      error: (error) => console.error('Error loading categories:', error)
    });
  }

  loadProducts() {
    this.productService.getProducts().subscribe({
      next: (data) => this.products = data,
      error: (error) => console.error('Error loading products:', error)
    });
  }

  showCreateForm() {
    this.editingCoupon = null;
    this.couponForm.reset();
    this.couponForm.patchValue({
      type: CouponType.Percentage,
      value: 0,
      maxUsageCount: 1,
      maxUsagePerUser: 1,
      isActive: true,
      isPublic: true
    });
    this.showForm = true;
  }

  editCoupon(coupon: CouponDto) {
    this.editingCoupon = coupon;
    this.couponForm.patchValue({
      name: coupon.name,
      description: coupon.description,
      type: coupon.type,
      value: coupon.value,
      minOrderAmount: coupon.minOrderAmount,
      maxDiscountAmount: coupon.maxDiscountAmount,
      startDate: new Date(coupon.startDate).toISOString().slice(0, 16),
      endDate: new Date(coupon.endDate).toISOString().slice(0, 16),
      maxUsageCount: coupon.maxUsageCount,
      maxUsagePerUser: coupon.maxUsagePerUser,
      isActive: coupon.isActive,
      isPublic: coupon.isPublic,
      categoryId: coupon.categoryId,
      productId: coupon.productId
    });
    this.showForm = true;
  }

  saveCoupon() {
    if (this.couponForm.valid) {
      const formValue = this.couponForm.value;
      
      if (this.editingCoupon) {
        const updateDto: UpdateCouponDto = {
          name: formValue.name,
          description: formValue.description,
          type: formValue.type,
          value: formValue.value,
          minOrderAmount: formValue.minOrderAmount,
          maxDiscountAmount: formValue.maxDiscountAmount,
          startDate: new Date(formValue.startDate),
          endDate: new Date(formValue.endDate),
          maxUsageCount: formValue.maxUsageCount,
          maxUsagePerUser: formValue.maxUsagePerUser,
          isActive: formValue.isActive,
          isPublic: formValue.isPublic,
          categoryId: formValue.categoryId,
          productId: formValue.productId
        };

        this.couponService.updateCoupon(this.editingCoupon.id, updateDto).subscribe({
          next: () => {
            this.loadCoupons();
            this.loadStatistics();
            this.showForm = false;
          },
          error: (error) => console.error('Error updating coupon:', error)
        });
      } else {
        const createDto: CreateCouponDto = {
          code: formValue.code,
          name: formValue.name,
          description: formValue.description,
          type: formValue.type,
          value: formValue.value,
          minOrderAmount: formValue.minOrderAmount,
          maxDiscountAmount: formValue.maxDiscountAmount,
          startDate: new Date(formValue.startDate),
          endDate: new Date(formValue.endDate),
          maxUsageCount: formValue.maxUsageCount,
          maxUsagePerUser: formValue.maxUsagePerUser,
          isActive: formValue.isActive,
          isPublic: formValue.isPublic,
          categoryId: formValue.categoryId,
          productId: formValue.productId
        };

        this.couponService.createCoupon(createDto).subscribe({
          next: () => {
            this.loadCoupons();
            this.loadStatistics();
            this.showForm = false;
          },
          error: (error) => console.error('Error creating coupon:', error)
        });
      }
    }
  }

  deleteCoupon(coupon: CouponDto) {
    if (confirm(`Bạn có chắc muốn xóa coupon "${coupon.name}"?`)) {
      this.couponService.deleteCoupon(coupon.id).subscribe({
        next: () => {
          this.loadCoupons();
          this.loadStatistics();
        },
        error: (error) => console.error('Error deleting coupon:', error)
      });
    }
  }

  applyFilters() {
    this.loadCoupons();
  }

  clearFilters() {
    this.searchTerm = '';
    this.filterActive = undefined;
    this.filterPublic = undefined;
    this.loadCoupons();
  }

  getCouponTypeText(type: CouponType): string {
    return type === CouponType.Percentage ? 'Phần trăm' : 'Số tiền cố định';
  }

  getValueDisplay(coupon: CouponDto): string {
    return coupon.type === CouponType.Percentage ? 
      `${coupon.value}%` : `${coupon.value.toLocaleString('vi-VN')}đ`;
  }
}
