import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../auth/services/auth.service';
import { ICategory } from '../../../../types/ICategory';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);

  private categories$: Observable<ICategory[]> | null = null;

  getAll(): Observable<ICategory[]> {
    if (!this.categories$) {
      this.categories$ = this.api.get<ICategory[]>('/api/Category').pipe(shareReplay(1));
    }
    return this.categories$;
  }

  refresh(): void {
    this.categories$ = null;
  }

  getById(id: string): Observable<ICategory> {
    return this.api.get<ICategory>(`/api/Category/${id}`);
  }

  create(payload: any): Observable<ICategory> {
    const organizationId = this.auth.getOrganizationId()!;
    return this.api.post<ICategory>('/api/Category', { ...payload, organizationId });
  }

  update(id: string, payload: any): Observable<ICategory> {
    return this.api.put<ICategory>(`/api/Category/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`/api/Category/${id}`);
  }
}
