import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { IOrder } from '../../../../types/IOrder';
import { IOrderHistory } from '../../../../types/IOrderHistory';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly api = inject(ApiService);

  getAll(filters?: { customerId?: string; startDate?: string; endDate?: string; statusIds?: string[] }): Observable<IOrder[]> {
    if (!filters) return this.api.get<IOrder[]>('/api/Order');

    let params = new HttpParams();
    if (filters.customerId) params = params.set('customerId', filters.customerId);
    if (filters.startDate) params = params.set('startDate', filters.startDate);
    if (filters.endDate) params = params.set('endDate', filters.endDate);
    if (filters.statusIds?.length) {
      for (const id of filters.statusIds) {
        params = params.append('statusIds', id);
      }
    }
    return this.api.getWithParams<IOrder[]>('/api/Order', params);
  }

  getById(id: string): Observable<IOrder> {
    return this.api.get<IOrder>(`/api/Order/${id}`);
  }

  create(payload: any): Observable<IOrder> {
    return this.api.post<IOrder>('/api/Order', payload);
  }

  update(id: string, payload: any): Observable<IOrder> {
    return this.api.put<IOrder>(`/api/Order/${id}`, payload);
  }

  receive(id: string, paymentMethodId: string, amount: number): Observable<boolean> {
    return this.api.post<boolean>(`/api/Order/${id}/receive`, { paymentMethodId, amount });
  }

  cancel(id: string): Observable<void> {
    return this.api.post<void>(`/api/Order/${id}/cancel`, {});
  }

  getHistory(id: string): Observable<IOrderHistory[]> {
    return this.api.get<IOrderHistory[]>(`/api/Order/${id}/history`);
  }
}
