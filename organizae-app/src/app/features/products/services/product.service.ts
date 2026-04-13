import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../auth/services/auth.service';
import { IProduct } from '../../../../types/IProduct';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);

  getAll(): Observable<IProduct[]> {
    return this.api.get<IProduct[]>('/api/Product');
  }

  getById(id: string): Observable<IProduct> {
    return this.api.get<IProduct>(`/api/Product/${id}`);
  }

  create(payload: any): Observable<IProduct> {
    const organizationId = this.auth.getOrganizationId()!;
    return this.api.post<IProduct>('/api/Product', { ...payload, organizationId });
  }

  update(id: string, payload: any): Observable<IProduct> {
    return this.api.put<IProduct>(`/api/Product/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`/api/Product/${id}`);
  }

  search(q: string): Observable<IProduct[]> {
    return this.api.get<IProduct[]>('/api/Product/search', { q });
  }
}
