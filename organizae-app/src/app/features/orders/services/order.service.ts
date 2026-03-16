import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { IOrder } from '../../../../types/IOrder';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly api = inject(ApiService);

  getAll(): Observable<IOrder[]> {
    return this.api.get<IOrder[]>('/api/Order');
  }

  getById(id: string): Observable<IOrder> {
    return this.api.get<IOrder>(`/api/Order/${id}`);
  }

  create(payload: any): Observable<IOrder> {
    return this.api.post<IOrder>('/api/Order', payload);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`/api/Order/${id}`);
  }
}
