export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  discount: number;
  discountPrice?: number;
  finalPrice: number;
  stockQuantity: number;
  quantityInStock: number;
  mainImageUrl: string;
  detailImageUrls: string[];
  imageUrls?: string[];
  categoryId: number;
  categoryName: string;
  isActive: boolean;
  isNew: boolean;
  isOnSale: boolean;
  isFeatured: boolean;
  averageRating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductDto {
  id: number;
  name: string;
  description: string;
  price: number;
  discount: number;
  discountPrice?: number;
  stockQuantity: number;
  quantityInStock: number;
  mainImageUrl?: string;
  detailImageUrls?: string[];
  imageUrls?: string[];
  categoryId: number;
  isActive: boolean;
  isNew: boolean;
  isOnSale: boolean;
  isFeatured: boolean;
}