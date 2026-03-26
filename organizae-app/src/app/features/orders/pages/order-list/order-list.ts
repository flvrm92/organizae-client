import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe, DatePipe, NgClass } from '@angular/common';
import { StatusClassPipe } from '../../../../shared/pipes/status-class.pipe';
import { IOrder } from '../../../../../types/IOrder';
import { OrderService } from '../../services/order.service';
import { ConfirmDialog } from '../../../../components/confirm-dialog/confirm-dialog';
import { ReceivePaymentDialog, ReceivePaymentDialogResult } from '../../components/receive-payment-dialog/receive-payment-dialog';
import { PageHeader } from '../../../../components/page-header/page-header';

@Component({
  selector: 'app-order-list',
  imports: [RouterLink,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatPaginatorModule,
    MatTooltipModule,
    MatChipsModule,
    FormsModule,
    CurrencyPipe,
    DatePipe,
    NgClass,
    PageHeader,
    StatusClassPipe],
  templateUrl: './order-list.html',
  styleUrl: './order-list.css'
})
export class OrderList implements OnInit {
  private readonly orderSvc = inject(OrderService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  orders = signal<IOrder[]>([]);
  filteredOrders = signal<IOrder[]>([]);
  pagedOrders = signal<IOrder[]>([]);
  loading = signal(false);
  searchTerm = '';
  pageSize = 20;
  pageIndex = 0;
  displayedColumns = ['code', 'customerName', 'subTotal', 'statusName', 'createdAt', 'actions'];

  ngOnInit(): void { this.loadOrders(); }

  loadOrders(): void {
    this.loading.set(true);
    this.orderSvc.getAll().subscribe({
      next: (data) => {
        this.orders.set(data.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
        this.applyFilter();
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Erro ao carregar pedidos', 'Fechar', {
          duration: 3000
        });
      }
    });
  }

  applyFilter(): void {
    const term = this.searchTerm.toLowerCase().trim();
    const filtered = term ? this.orders().filter(o => o.id?.toLowerCase().includes(term) || o.customerId?.toLowerCase().includes(term)) : this.orders();
    this.filteredOrders.set(filtered);
    this.pageIndex = 0;
    this.updatePage();
  }

  updatePage(): void {
    const start = this.pageIndex * this.pageSize;
    this.pagedOrders.set(this.filteredOrders().slice(start, start + this.pageSize));
  }

  onPage(event: PageEvent): void { this.pageSize = event.pageSize; this.pageIndex = event.pageIndex; this.updatePage(); }

  cancelOrder(order: IOrder): void {
    const ref = this.dialog.open(ConfirmDialog, {
      data: {
        title: 'Cancelar Pedido',
        message: `Deseja cancelar o pedido #${order.id.substring(0, 8)}...?`,
        confirmLabel: 'Cancelar'
      },
      width: '400px'
    });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.orderSvc.cancel(order.id).subscribe({
        next: () => { this.snackBar.open('Pedido cancelado!', 'Fechar', { duration: 3000 }); this.loadOrders(); },
        error: () => this.snackBar.open('Erro ao cancelar pedido', 'Fechar', { duration: 3000 })
      });
    });
  }

  receiveOrder(order: IOrder): void {
    const ref = this.dialog.open(ReceivePaymentDialog, {
      data: { orderId: order.id, orderCode: order.code, orderTotal: order.subTotal },
      width: '440px',
      disableClose: true
    });
    ref.afterClosed().subscribe((result: ReceivePaymentDialogResult | false) => {
      if (!result) return;
      this.orderSvc.receive(order.id, result.paymentMethodId, result.amount).subscribe({
        next: () => { this.snackBar.open('Pagamento registrado!', 'Fechar', { duration: 3000 }); this.loadOrders(); },
        error: () => this.snackBar.open('Erro ao registrar pagamento', 'Fechar', { duration: 3000 })
      });
    });
  }
}

