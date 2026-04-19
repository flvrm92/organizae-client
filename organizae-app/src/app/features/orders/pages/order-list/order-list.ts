import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
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
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { CurrencyPipe, DatePipe, NgClass } from '@angular/common';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatSelectModule } from '@angular/material/select';
import { provideNativeDateAdapter } from '@angular/material/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, filter, switchMap } from 'rxjs';
import { StatusClassPipe } from '../../../../shared/pipes/status-class.pipe';
import { IOrder } from '../../../../../types/IOrder';
import { IStatus } from '../../../../../types/IStatus';
import { ICustomerSearch } from '../../../../../types/ICustomerSearch';
import { OrderService } from '../../services/order.service';
import { StatusService } from '../../../../core/services/status.service';
import { CustomerService } from '../../../customers/services/customer.service';
import { ConfirmDialog } from '../../../../components/confirm-dialog/confirm-dialog';
import { ReceivePaymentDialog, ReceivePaymentDialogResult } from '../../components/receive-payment-dialog/receive-payment-dialog';
import { PageHeader } from '../../../../components/page-header/page-header';
import { removeAccents } from '../../../../shared/utils/string-utils';

@Component({
  selector: 'app-order-list',
  providers: [provideNativeDateAdapter()],
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
    ReactiveFormsModule,
    MatDatepickerModule,
    MatAutocompleteModule,
    MatSelectModule,
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
  private readonly statusSvc = inject(StatusService);
  private readonly customerSvc = inject(CustomerService);
  private readonly destroyRef = inject(DestroyRef);
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

  customerSearchControl = new FormControl('');
  customerSearchResults = signal<ICustomerSearch[]>([]);
  selectedCustomer = signal<ICustomerSearch | null>(null);
  startDate = new FormControl<Date | null>(null);
  endDate = new FormControl<Date | null>(null);
  selectedStatusIds = new FormControl<string[]>([]);
  statuses = signal<IStatus[]>([]);

  ngOnInit(): void {
    this.loadOrders();

    this.statusSvc.getAll().subscribe(s => this.statuses.set(s));

    this.customerSearchControl.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
      debounceTime(300),
      filter(v => typeof v === 'string' && v.length >= 2),
      switchMap(v => this.customerSvc.search(v as string))
    ).subscribe(results => this.customerSearchResults.set(results));

    this.startDate.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.loadOrders());
    this.endDate.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.loadOrders());
    this.selectedStatusIds.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.loadOrders());
  }

  loadOrders(): void {
    this.loading.set(true);
    const filters: { customerId?: string; startDate?: string; endDate?: string; statusIds?: string[] } = {};
    const customer = this.selectedCustomer();
    if (customer) filters.customerId = customer.id;
    const startDateVal = this.formatDate(this.startDate.value, false);
    if (startDateVal) filters.startDate = startDateVal;
    const endDateVal = this.formatDate(this.endDate.value, true);
    if (endDateVal) filters.endDate = endDateVal;
    const statusIds = this.selectedStatusIds.value;
    if (statusIds?.length) filters.statusIds = statusIds;

    this.orderSvc.getAll(Object.keys(filters).length ? filters : undefined).subscribe({
      next: (data) => {
        this.orders.set(data.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
        this.applyFilter();
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Erro ao carregar pedidos', 'Fechar', { duration: 3000 });
      }
    });
  }

  applyFilter(): void {
    const term = removeAccents(this.searchTerm.toLowerCase().trim());
    const filtered = term ? this.orders().filter(o => removeAccents(o.id?.toLowerCase() ?? '').includes(term) || removeAccents(o.customerId?.toLowerCase() ?? '').includes(term)) : this.orders();
    this.filteredOrders.set(filtered);
    this.pageIndex = 0;
    this.updatePage();
  }

  updatePage(): void {
    const start = this.pageIndex * this.pageSize;
    this.pagedOrders.set(this.filteredOrders().slice(start, start + this.pageSize));
  }

  onPage(event: PageEvent): void { this.pageSize = event.pageSize; this.pageIndex = event.pageIndex; this.updatePage(); }

  displayCustomer = (c: ICustomerSearch | null | undefined): string => {
    return c ? `${c.firstName} ${c.lastName}` : '';
  };

  onCustomerSelected(event: MatAutocompleteSelectedEvent): void {
    this.selectedCustomer.set(event.option.value);
    this.loadOrders();
  }

  clearFilters(): void {
    this.customerSearchControl.reset('', { emitEvent: false });
    this.selectedCustomer.set(null);
    this.startDate.reset(null, { emitEvent: false });
    this.endDate.reset(null, { emitEvent: false });
    this.selectedStatusIds.reset([], { emitEvent: false });
    this.loadOrders();
  }

  private formatDate(date: Date | null, endOfDay: boolean): string | undefined {
    if (!date) return undefined;
    const d = new Date(date);
    if (endOfDay) {
      d.setHours(23, 59, 59, 999);
    } else {
      d.setHours(0, 0, 0, 0);
    }
    return d.toISOString();
  }

  cancelOrder(order: IOrder): void {
    const ref = this.dialog.open(ConfirmDialog, {
      data: {
        title: 'Cancelar Pedido',
        message: `Deseja cancelar o pedido #${order.code} ?`,
        confirmLabel: 'Cancelar Pedido'
      },
      width: '400px'
    });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.orderSvc.cancel(order.id).subscribe({
        next: () => {
          this.snackBar.open('Pedido cancelado!', 'Fechar', { duration: 3000 });
          this.loadOrders();
        },
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

