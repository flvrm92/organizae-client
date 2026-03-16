import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { IStockEntry } from '../../../../types/IStockEntry';
import { IStockMovement, IStockMovementProductSummary } from '../../../../types/IStockMovement';

@Injectable({ providedIn: 'root' })
export class StockService {
  private readonly api = inject(ApiService);

  getAllEntries(): Observable<IStockEntry[]> {
    return this.api.get<IStockEntry[]>('/api/StockEntry');
  }

  getEntryById(id: string): Observable<IStockEntry> {
    return this.api.get<IStockEntry>(`/api/StockEntry/${id}`);
  }

  createEntry(payload: any): Observable<IStockEntry> {
    return this.api.post<IStockEntry>('/api/StockEntry', payload);
  }

  deleteEntry(id: string): Observable<void> {
    return this.api.delete<void>(`/api/StockEntry/${id}`);
  }

  getMovementSummary(startDate?: string, endDate?: string): Observable<IStockMovementProductSummary[]> {
    const params: Record<string, string> = {};
    if (startDate) params['startDate'] = startDate;
    if (endDate) params['endDate'] = endDate;
    return this.api.get<IStockMovementProductSummary[]>('/api/StockMovement', params);
  }
}
