export interface ApplicationUser {
  id: string;
  userName: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  isActive: boolean;
  emailConfirmed: boolean;
  createdAt: Date;
  lastLoginAt?: Date;
  roles: string[];
}

export interface CreateUserDto {
  userName: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  password: string;
  roles: string[];
}

export interface UpdateUserDto {
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  isActive: boolean;
  roles: string[];
}

export interface UserDto {
  id: string;
  userName: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phoneNumber?: string;
  isActive: boolean;
  emailConfirmed: boolean;
  createdAt: Date;
  lastLoginAt?: Date;
  roles: string[];
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ResetPasswordDto {
  email: string;
  token: string;
  newPassword: string;
}