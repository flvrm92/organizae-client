import { Component, OnInit, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentMethodService } from '../../services/payment-method.service';
import { IPaymentMethod } from '../../../../../types/IPaymentMethod';

export interface ReceivePaymentDialogData {
  orderId: string;
  orderCode: number;
  orderTotal: number;
}

export interface ReceivePaymentDialogResult {
  paymentMethodId: string;
  amount: number;
}

@Component({
  selector: 'app-receive-payment-dialog',
  imports: [MatDialogModule, MatButtonModule, MatFormFieldModule, MatSelectModule, MatInputModule, MatIconModule, MatProgressSpinnerModule, CurrencyPipe, FormsModule],
  templateUrl: './receive-payment-dialog.html',
  styleUrl: './receive-payment-dialog.css'
})
export class ReceivePaymentDialog implements OnInit {
  readonly dialogRef = inject(MatDialogRef<ReceivePaymentDialog>);
  readonly data: ReceivePaymentDialogData = inject(MAT_DIALOG_DATA);
  private readonly paymentMethodSvc = inject(PaymentMethodService);

  paymentMethods = signal<IPaymentMethod[]>([]);
  loading = signal(true);
  selectedPaymentMethodId = '';
  amount = 0;

  ngOnInit(): void {
    this.amount = this.data.orderTotal;
    this.paymentMethodSvc.getAll().subscribe({
      next: (methods) => { this.paymentMethods.set(methods); this.loading.set(false); },
      error: () => { this.loading.set(false); }
    });
  }

  confirm(): void {
    if (!this.selectedPaymentMethodId) return;
    this.dialogRef.close({ paymentMethodId: this.selectedPaymentMethodId, amount: this.amount } as ReceivePaymentDialogResult);
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
