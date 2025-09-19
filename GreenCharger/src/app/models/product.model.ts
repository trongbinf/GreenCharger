export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  discount?: number;
  stockQuantity: number;
  mainImageUrl?: string;
  detailImageUrls?: string[];
  categoryId: number;
  category?: any; // Tránh circular dependency
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  orderDetails?: OrderDetail[];
}

export interface ProductDto {
  id: number;
  name: string;
  description: string;
  price: number;
  discountPrice?: number;
  discount?: number;
  stockQuantity: number;
  mainImageUrl?: string;
  detailImageUrls?: string[];
  categoryId: number;
  categoryName?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProductDto {
  name: string;
  description: string;
  price: number;
  discount?: number;
  stockQuantity: number;
  categoryId: number;
  isActive: boolean;
}

export interface UpdateProductDto {
  name: string;
  description: string;
  price: number;
  discount?: number;
  stockQuantity: number;
  categoryId: number;
  isActive: boolean;
}

export interface OrderDetail {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  product?: Product;
}