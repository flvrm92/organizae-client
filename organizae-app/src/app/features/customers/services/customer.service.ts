import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../auth/services/auth.service';
import { ICustomer } from '../../../../types/ICustomer';

export interface CreateCustomerRequest {
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  cellPhone: string | null;
  document: string | null;
  organizationId: string;
  addresses?: Partial<import('../../../../types/IAddress').IAddress>[];
}

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);

  getAll(): Observable<ICustomer[]> {
    return this.api.get<ICustomer[]>('/api/Customer');
  }

  getById(id: string): Observable<ICustomer> {
    return this.api.get<ICustomer>(`/api/Customer/${id}`);
  }

  create(customer: Omit<CreateCustomerRequest, 'organizationId'>): Observable<ICustomer> {
    const organizationId = this.auth.getOrganizationId()!;
    return this.api.post<ICustomer>('/api/Customer', { ...customer, organizationId });
  }

  update(id: string, customer: Partial<CreateCustomerRequest>): Observable<ICustomer> {
    return this.api.put<ICustomer>(`/api/Customer/${id}`, customer);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`/api/Customer/${id}`);
  }
}
