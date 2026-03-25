import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { IPaymentMethod } from '../../../../types/IPaymentMethod';

@Injectable({ providedIn: 'root' })
export class PaymentMethodService {
  private readonly api = inject(ApiService);

  getAll(): Observable<IPaymentMethod[]> {
    return this.api.get<IPaymentMethod[]>('/api/PaymentMethod');
  }
}
