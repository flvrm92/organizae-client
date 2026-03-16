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
import { CurrencyPipe, DatePipe, SlicePipe } from '@angular/common';
import { IOrder } from '../../../../../types/IOrder';
import { OrderService } from '../../services/order.service';
import { ConfirmDialog } from '../../../../components/confirm-dialog/confirm-dialog';
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
    PageHeader],
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
      next: (data) => { this.orders.set(data); this.applyFilter(); this.loading.set(false); },
      error: () => { this.loading.set(false); this.snackBar.open('Erro ao carregar pedidos', 'Fechar', { duration: 3000 }); }
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

  deleteOrder(order: IOrder): void {
    const ref = this.dialog.open(ConfirmDialog, {
      data: {
        title: 'Excluir Pedido',
        message: `Deseja excluir o pedido #${order.id.substring(0, 8)}...?`,
        confirmLabel: 'Excluir'
      },
      width: '400px'
    });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.orderSvc.delete(order.id).subscribe({
        next: () => { this.snackBar.open('Pedido excluído!', 'Fechar', { duration: 3000 }); this.loadOrders(); },
        error: () => this.snackBar.open('Erro ao excluir pedido', 'Fechar', { duration: 3000 })
      });
    });
  }
}

