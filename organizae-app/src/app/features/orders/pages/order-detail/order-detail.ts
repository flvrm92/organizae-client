import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CurrencyPipe, DatePipe, NgClass } from '@angular/common';
import { StatusClassPipe } from '../../../../shared/pipes/status-class.pipe';
import { IOrder } from '../../../../../types/IOrder';
import { IOrderHistory } from '../../../../../types/IOrderHistory';
import { OrderService } from '../../services/order.service';
import { PageHeader } from '../../../../components/page-header/page-header';

@Component({
  selector: 'app-order-detail',
  imports: [
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatDividerModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    CurrencyPipe,
    DatePipe,
    NgClass,
    PageHeader,
    StatusClassPipe],
  templateUrl: './order-detail.html',
  styleUrl: './order-detail.css'
})
export class OrderDetail implements OnInit {
  private readonly orderSvc = inject(OrderService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  order = signal<IOrder | null>(null);
  history = signal<IOrderHistory[]>([]);
  loading = signal(false);
  itemColumns = ['productSnapshotName', 'quantity', 'unitPrice', 'discount', 'total'];
  paymentColumns = ['paymentMethodName', 'amount', 'createdAt'];
  isEditable = computed(() => this.order()?.statusName === 'Ativo');

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadOrder(id);
    else this.router.navigate(['/pedidos']);
  }

  loadOrder(id: string): void {
    this.loading.set(true);
    this.orderSvc.getById(id).subscribe({
      next: (o) => {
        this.order.set(o);
        this.loading.set(false);
        this.loadHistory(id);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Erro ao carregar pedido', 'Fechar', { duration: 3000 });
        this.router.navigate(['/pedidos']);
      }
    });
  }

  private loadHistory(id: string): void {
    this.orderSvc.getHistory(id).subscribe({
      next: (h) => this.history.set(h),
      error: () => { }
    });
  }
}


