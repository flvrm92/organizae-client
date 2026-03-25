import { Injectable, inject } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';
import { ApiService } from './api.service';
import { IStatus } from '../../../types/IStatus';

@Injectable({ providedIn: 'root' })
export class StatusService {
  private readonly api = inject(ApiService);
  private readonly statuses$ = this.api.get<IStatus[]>('/api/Status').pipe(shareReplay(1));

  getAll(): Observable<IStatus[]> {
    return this.statuses$;
  }
}
