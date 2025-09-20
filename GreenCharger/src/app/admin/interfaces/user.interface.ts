export interface User {
  id: string;
  userName: string;
  email: string;
  emailConfirmed: boolean;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  address: string;
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
  address: string;
  createdAt: string;
  updatedAt: string;
  lockoutEnd: string;
  lockoutEnabled: boolean;
}
