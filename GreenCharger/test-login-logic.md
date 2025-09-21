# Test Login Logic

## ✅ Đã cấu hình:

### 1. Login Component Logic:
- **Admin user** (có role 'Admin') → redirect đến `/admin/dashboard`
- **Regular user** (không có role 'Admin') → redirect đến `/` (home)

### 2. Admin Routes Protection:
- Tất cả admin routes đều có `canActivate: [AdminAuthGuard]`
- Guard kiểm tra:
  - User đã đăng nhập (`isAuthenticated()`)
  - User có role 'Admin' (`currentUser?.roles?.includes('Admin')`)
  - Nếu không đủ điều kiện → redirect về `/login`

### 3. Test Cases:

#### Test Case 1: Admin Login
- Email: `admin@mocviet.com`
- Password: `Admin@123`
- Expected: Redirect to `/admin/dashboard`

#### Test Case 2: Regular User Login
- Email: `user@mocviet.com`
- Password: `User@123`
- Expected: Redirect to `/` (home)

#### Test Case 3: Direct Admin Access
- User thường cố gắng truy cập `/admin/dashboard`
- Expected: Redirect to `/login`

## 🚀 Cách test:
1. Start API: `cd ../GreenChargerAPI && dotnet run`
2. Start Frontend: `ng serve`
3. Test login với các tài khoản khác nhau
4. Thử truy cập trực tiếp admin routes
