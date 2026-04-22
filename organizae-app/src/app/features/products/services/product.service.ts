import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../auth/services/auth.service';
import { IProduct } from '../../../../types/IProduct';
import { IProductSearch } from '../../../../types/IProductSearch';
import { IProductListFilters } from '../../../../types/IProductListFilters';
import { IProductFilterMetadata } from '../../../../types/IProductFilterMetadata';

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

  search(q: string, inStockOnly = false): Observable<IProductSearch[]> {
    return this.api.get<IProductSearch[]>('/api/Product/search', { q, inStockOnly: String(inStockOnly) });
  }

  getFiltered(filters: IProductListFilters): Observable<IProduct[]> {
    let params = new HttpParams();
    if (filters.q) params = params.set('q', filters.q);
    if (filters.categoryId) params = params.set('categoryId', filters.categoryId);
    if (filters.subcategoryId) params = params.set('subcategoryId', filters.subcategoryId);
    if (filters.statusId) params = params.set('statusId', filters.statusId);
    for (const size of filters.sizes ?? []) params = params.append('sizes', size);
    for (const color of filters.colors ?? []) params = params.append('colors', color);
    for (const tag of filters.tags ?? []) params = params.append('tags', tag);
    return this.api.getWithParams<IProduct[]>('/api/Product/filtered', params);
  }

  getFilterMetadata(): Observable<IProductFilterMetadata> {
    return this.api.get<IProductFilterMetadata>('/api/Product/filters');
  }
}
