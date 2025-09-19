export interface Address {
  id: number;
  fullName: string;
  phoneNumber: string;
  province: string;
  district: string;
  ward: string;
  detailAddress: string;
  note?: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export interface CreateAddressDto {
  fullName: string;
  phoneNumber: string;
  province: string;
  district: string;
  ward: string;
  detailAddress: string;
  note?: string;
  isDefault: boolean;
}

export interface UpdateAddressDto {
  fullName: string;
  phoneNumber: string;
  province: string;
  district: string;
  ward: string;
  detailAddress: string;
  note?: string;
  isDefault: boolean;
}

export interface AddressDto {
  id: number;
  fullName: string;
  phoneNumber: string;
  province: string;
  district: string;
  ward: string;
  detailAddress: string;
  note?: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  fullAddress: string;
}