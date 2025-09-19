export interface Category {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  products?: any[]; // Tránh circular dependency
}

export interface CategoryDto {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  productCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCategoryDto {
  name: string;
  description: string;
  isActive: boolean;
}

export interface UpdateCategoryDto {
  name: string;
  description: string;
  isActive: boolean;
}