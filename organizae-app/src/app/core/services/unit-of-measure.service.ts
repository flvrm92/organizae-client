import { Injectable, inject } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';
import { ApiService } from './api.service';
import { IUnitOfMeasure } from '../../../types/IUnitOfMeasure';

@Injectable({ providedIn: 'root' })
export class UnitOfMeasureService {
  private readonly api = inject(ApiService);
  private readonly units$ = this.api.get<IUnitOfMeasure[]>('/api/UnitOfMeasure').pipe(shareReplay(1));

  getAll(): Observable<IUnitOfMeasure[]> {
    return this.units$;
  }
}
