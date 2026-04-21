import { Component, OnInit, computed, inject, signal } from '@angular/core';
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
  remainingBalance: number;
}

export interface PaymentRow {
  methodId: string;
  amount: number;
}

export interface ReceivePaymentDialogResult {
  payments: { paymentMethodId: string; amount: number }[];
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
  payments = signal<PaymentRow[]>([{ methodId: '', amount: 0 }]);

  totalPaid = computed(() => this.payments().reduce((sum, p) => sum + (p.amount || 0), 0));
  remainingTotal = computed(() => Math.max(0, this.data.remainingBalance - this.totalPaid()));

  ngOnInit(): void {
    this.payments.set([{ methodId: '', amount: this.data.remainingBalance }]);
    this.paymentMethodSvc.getAll().subscribe({
      next: (methods) => { this.paymentMethods.set(methods); this.loading.set(false); },
      error: () => { this.loading.set(false); }
    });
  }

  addPayment(): void {
    this.payments.update(rows => [...rows, { methodId: '', amount: 0 }]);
  }

  removePayment(index: number): void {
    this.payments.update(rows => rows.filter((_, i) => i !== index));
  }

  isValid(): boolean {
    const rows = this.payments();
    if (rows.length === 0) return false;
    const allFilled = rows.every(p => p.methodId && p.amount > 0);
    const total = rows.reduce((sum, p) => sum + (p.amount || 0), 0);
    return allFilled && total > 0 && total <= this.data.remainingBalance + 0.001;
  }

  confirm(): void {
    if (!this.isValid()) return;
    this.dialogRef.close({
      payments: this.payments().map(p => ({ paymentMethodId: p.methodId, amount: p.amount }))
    } as ReceivePaymentDialogResult);
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
