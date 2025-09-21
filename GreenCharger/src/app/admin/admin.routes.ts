import { Routes } from '@angular/router';
import { AdminAuthGuard } from '../guards/admin-auth.guard';

export const adminRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    canActivate: [AdminAuthGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'users',
        loadComponent: () => import('./components/users/users.component').then(m => m.UsersComponent)
      },
      {
        path: 'categories',
        loadComponent: () => import('./components/categories/categories.component').then(m => m.CategoriesComponent)
      },
      {
        path: 'products',
        loadComponent: () => import('./components/products/products.component').then(m => m.ProductsComponent)
      },
      {
        path: 'orders',
        loadComponent: () => import('./components/orders/orders.component').then(m => m.OrdersComponent)
      },
      {
        path: 'slider',
        loadComponent: () => import('./components/slider/slider.component').then(m => m.SliderComponent)
      }
    ]
  }
];
