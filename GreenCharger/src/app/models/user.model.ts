export interface User {
  id: string;
  userName: string;
  email: string;
  emailConfirmed: boolean;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  updatedAt: string;
  lockoutEnd: string;
  lockoutEnabled: boolean;
}

export interface UserDto {
  id: string;
  userName: string;
  email: string;
  emailConfirmed: boolean;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  updatedAt: string;
  lockoutEnd: string;
  lockoutEnabled: boolean;
}

// Authentication interfaces
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    emailConfirmed: boolean;
    roles: string[];
    createdAt: string;
    updatedAt: string;
  };
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  phoneNumber?: string;
  role?: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
}

export interface ResetPasswordRequest {
  email: string;
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  emailConfirmed?: boolean;
}

export interface UpdateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phoneNumber?: string;
  emailConfirmed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserRole {
  id: string;
  name: string;
}

export interface UserStatus {
  isActive: boolean;
  isLocked: boolean;
  lockoutEnd?: string;
}

export interface UserSearchFilters {
  searchTerm?: string;
  role?: string;
  status?: 'active' | 'inactive' | 'locked';
  emailConfirmed?: boolean;
  createdFrom?: string;
  createdTo?: string;
}

export interface UserListResponse {
  users: User[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  lockedUsers: number;
  unconfirmedUsers: number;
  newUsersThisMonth: number;
}
