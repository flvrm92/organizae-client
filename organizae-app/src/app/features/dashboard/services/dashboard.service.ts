import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { IOrder } from '../../../../types/IOrder';
import { ICustomer } from '../../../../types/ICustomer';
import { IProduct } from '../../../../types/IProduct';
import { IStockEntry } from '../../../../types/IStockEntry';

export interface DashboardStats {
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  totalStockEntries: number;
  recentOrders: IOrder[];
  ordersByStatus: { name: string; value: number }[];
  revenueData: { name: string; value: number }[];
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly api = inject(ApiService);

  getStats(): Observable<DashboardStats> {
    return forkJoin({
      orders: this.api.get<IOrder[]>('/api/Order'),
      customers: this.api.get<ICustomer[]>('/api/Customer'),
      products: this.api.get<IProduct[]>('/api/Product'),
      stockEntries: this.api.get<IStockEntry[]>('/api/StockEntry')
    }).pipe(
      map(({ orders, customers, products, stockEntries }) => {
        const statusMap = new Map<string, number>();
        orders.forEach(o => {
          const status = o.statusName ?? 'unknown';
          statusMap.set(status, (statusMap.get(status) ?? 0) + 1);
        });

        const ordersByStatus = Array.from(statusMap.entries()).map(([name, value]) => ({ name, value }));

        const revenueData = orders
          .slice()
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
          .slice(-12)
          .map(o => ({ name: new Date(o.createdAt).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' }), value: o.subTotal ?? 0 }));

        return {
          totalOrders: orders.length,
          totalCustomers: customers.length,
          totalProducts: products.length,
          totalStockEntries: stockEntries.length,
          recentOrders: orders.slice(-5).reverse(),
          ordersByStatus,
          revenueData
        };
      })
    );
  }
}
