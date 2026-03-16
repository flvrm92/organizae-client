import { Routes } from '@angular/router';
import { authGuard } from './auth/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./auth/pages/login/login').then(m => m.Login)
  },
  {
    path: 'alterar-senha',
    loadComponent: () => import('./auth/pages/change-password/change-password').then(m => m.ChangePassword),
    canActivate: [authGuard]
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/pages/dashboard/dashboard').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'clientes',
    loadComponent: () => import('./features/customers/pages/customer-list/customer-list').then(m => m.CustomerList),
    canActivate: [authGuard]
  },
  {
    path: 'clientes/novo',
    loadComponent: () => import('./features/customers/pages/customer-form/customer-form').then(m => m.CustomerForm),
    canActivate: [authGuard]
  },
  {
    path: 'clientes/:id',
    loadComponent: () => import('./features/customers/pages/customer-form/customer-form').then(m => m.CustomerForm),
    canActivate: [authGuard]
  },
  {
    path: 'fornecedores',
    loadComponent: () => import('./features/suppliers/pages/supplier-list/supplier-list').then(m => m.SupplierList),
    canActivate: [authGuard]
  },
  {
    path: 'fornecedores/novo',
    loadComponent: () => import('./features/suppliers/pages/supplier-form/supplier-form').then(m => m.SupplierForm),
    canActivate: [authGuard]
  },
  {
    path: 'fornecedores/:id',
    loadComponent: () => import('./features/suppliers/pages/supplier-form/supplier-form').then(m => m.SupplierForm),
    canActivate: [authGuard]
  },
  {
    path: 'produtos',
    loadComponent: () => import('./features/products/pages/product-list/product-list').then(m => m.ProductList),
    canActivate: [authGuard]
  },
  {
    path: 'produtos/novo',
    loadComponent: () => import('./features/products/pages/product-form/product-form').then(m => m.ProductForm),
    canActivate: [authGuard]
  },
  {
    path: 'produtos/:id',
    loadComponent: () => import('./features/products/pages/product-form/product-form').then(m => m.ProductForm),
    canActivate: [authGuard]
  },
  {
    path: 'pedidos',
    loadComponent: () => import('./features/orders/pages/order-list/order-list').then(m => m.OrderList),
    canActivate: [authGuard]
  },
  {
    path: 'pedidos/novo',
    loadComponent: () => import('./features/orders/pages/order-create/order-create').then(m => m.OrderCreate),
    canActivate: [authGuard]
  },
  {
    path: 'pedidos/:id',
    loadComponent: () => import('./features/orders/pages/order-detail/order-detail').then(m => m.OrderDetail),
    canActivate: [authGuard]
  },
  {
    path: 'estoque/entradas',
    loadComponent: () => import('./features/stock/pages/stock-entry-list/stock-entry-list').then(m => m.StockEntryList),
    canActivate: [authGuard]
  },
  {
    path: 'estoque/entradas/nova',
    loadComponent: () => import('./features/stock/pages/stock-entry-form/stock-entry-form').then(m => m.StockEntryForm),
    canActivate: [authGuard]
  },
  {
    path: 'estoque/entradas/:id',
    loadComponent: () => import('./features/stock/pages/stock-entry-detail/stock-entry-detail').then(m => m.StockEntryDetail),
    canActivate: [authGuard]
  },
  {
    path: 'estoque/movimentacoes',
    loadComponent: () => import('./features/stock/pages/stock-movement/stock-movement').then(m => m.StockMovement),
    canActivate: [authGuard]
  },
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];


