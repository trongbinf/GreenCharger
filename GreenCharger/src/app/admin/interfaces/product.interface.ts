export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  discount: number;
  finalPrice: number;
  stockQuantity: number;
  mainImageUrl: string;
  detailImageUrls: string[];
  categoryId: number;
  categoryName: string;
  isActive: boolean;
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
  finalPrice: number;
  stockQuantity: number;
  mainImageUrl: string;
  detailImageUrls: string[];
  categoryId: number;
  categoryName: string;
  isActive: boolean;
  averageRating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}
