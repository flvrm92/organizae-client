import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { IFechamentoReport } from '../../../../types/IFechamentoReport';

export interface FechamentoReportFilters {
  startDate: string;
  endDate: string;
  customerId?: string;
  statusId?: string;
  productId?: string;
  categoryId?: string;
  subcategoryId?: string;
}

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly api = inject(ApiService);

  getFechamento(filters: FechamentoReportFilters): Observable<IFechamentoReport> {
    let params = new HttpParams()
      .set('startDate', filters.startDate)
      .set('endDate', filters.endDate);

    if (filters.customerId) params = params.set('customerId', filters.customerId);
    if (filters.statusId) params = params.set('statusId', filters.statusId);
    if (filters.productId) params = params.set('productId', filters.productId);
    if (filters.categoryId) params = params.set('categoryId', filters.categoryId);
    if (filters.subcategoryId) params = params.set('subcategoryId', filters.subcategoryId);

    return this.api.getWithParams<IFechamentoReport>('/api/report/fechamento', params);
  }
}
