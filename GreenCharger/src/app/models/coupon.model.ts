export enum CouponType {
  Percentage = 0,
  FixedAmount = 1
}

export interface Coupon {
  id: number;
  code: string;
  name: string;
  description?: string;
  type: CouponType;
  value: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  startDate: Date;
  endDate: Date;
  maxUsageCount: number;
  maxUsagePerUser: number;
  currentUsageCount: number;
  isActive: boolean;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  categoryId?: number;
  productId?: number;
}

export interface CouponDto {
  id: number;
  code: string;
  name: string;
  description?: string;
  type: CouponType;
  typeDisplay: string;
  value: number;
  valueDisplay: string;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  startDate: Date;
  endDate: Date;
  maxUsageCount: number;
  maxUsagePerUser: number;
  currentUsageCount: number;
  remainingUsage: number;
  isActive: boolean;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  categoryId?: number;
  categoryName?: string;
  productId?: number;
  productName?: string;
  isExpired: boolean;
  isNotStarted: boolean;
  canUse: boolean;
  userUsageCount: number;
  canUserUse: boolean;
}

export interface CreateCouponDto {
  code: string;
  name: string;
  description?: string;
  type: CouponType;
  value: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  startDate: Date;
  endDate: Date;
  maxUsageCount: number;
  maxUsagePerUser: number;
  isActive: boolean;
  isPublic: boolean;
  categoryId?: number;
  productId?: number;
}

export interface UpdateCouponDto {
  name: string;
  description?: string;
  type: CouponType;
  value: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  startDate: Date;
  endDate: Date;
  maxUsageCount: number;
  maxUsagePerUser: number;
  isActive: boolean;
  isPublic: boolean;
  categoryId?: number;
  productId?: number;
}

export interface CouponValidationDto {
  isValid: boolean;
  message: string;
  discountAmount: number;
  couponId?: number;
}

export interface ValidateCouponDto {
  code: string;
  orderAmount: number;
  categoryIds?: number[];
  productIds?: number[];
}

export interface ApplyCouponDto {
  couponId: number;
  orderId: number;
  discountAmount: number;
}

export interface CouponUsageDto {
  id: number;
  couponCode: string;
  couponName: string;
  orderId: number;
  discountAmount: number;
  usedAt: Date;
}

export interface CouponStatisticsDto {
  totalCoupons: number;
  activeCoupons: number;
  expiredCoupons: number;
  totalUsages: number;
  totalDiscountAmount: number;
  topUsedCoupons: any[];
}