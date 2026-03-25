import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../auth/services/auth.service';
import { ISupplier } from '../../../../types/ISupplier';
import { ISupplierSearch } from '../../../../types/ISupplierSearch';

@Injectable({ providedIn: 'root' })
export class SupplierService {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);

  getAll(): Observable<ISupplier[]> {
    return this.api.get<ISupplier[]>('/api/Supplier');
  }

  getById(id: string): Observable<ISupplier> {
    return this.api.get<ISupplier>(`/api/Supplier/${id}`);
  }

  create(payload: Omit<any, 'organizationId'>): Observable<ISupplier> {
    const organizationId = this.auth.getOrganizationId()!;
    return this.api.post<ISupplier>('/api/Supplier', { ...payload, organizationId });
  }

  update(id: string, payload: any): Observable<ISupplier> {
    return this.api.put<ISupplier>(`/api/Supplier/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`/api/Supplier/${id}`);
  }

  search(q: string): Observable<ISupplierSearch[]> {
    return this.api.get<ISupplierSearch[]>('/api/Supplier/search', { q });
  }
}
