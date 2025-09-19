export interface Wishlist {
  id: number;
  createdAt: Date;
  userId: string;
  productId: number;
}

export interface WishlistDto {
  id: number;
  createdAt: Date;
  userId: string;
  productId: number;
  product: any; // Will be ProductDto from backend
}

export interface AddToWishlistDto {
  productId: number;
}