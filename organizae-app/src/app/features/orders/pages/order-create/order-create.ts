import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, filter, switchMap } from 'rxjs';
import { Router, RouterLink } from '@angular/router';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog } from '@angular/material/dialog';
import { CurrencyPipe } from '@angular/common';
import { OrderService } from '../../services/order.service';
import { CustomerService } from '../../../customers/services/customer.service';
import { ProductService } from '../../../products/services/product.service';
import { PageHeader } from '../../../../components/page-header/page-header';
import { ReceivePaymentDialog, ReceivePaymentDialogResult } from '../../components/receive-payment-dialog/receive-payment-dialog';
import { ICustomerSearch } from '../../../../../types/ICustomerSearch';
import { IProduct } from '../../../../../types/IProduct';

@Component({
  selector: 'app-order-create',
  imports: [ReactiveFormsModule, RouterLink, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatSelectModule, MatAutocompleteModule, MatProgressSpinnerModule, MatTableModule, MatDividerModule, CurrencyPipe, PageHeader],
  templateUrl: './order-create.html',
  styleUrl: './order-create.css'
})
export class OrderCreate implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly orderSvc = inject(OrderService);
  private readonly customerSvc = inject(CustomerService);
  private readonly productSvc = inject(ProductService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  customerSearchControl = new FormControl('');
  customerSearchResults = signal<ICustomerSearch[]>([]);
  products = signal<IProduct[]>([]);
  saving = signal(false);
  itemsData = signal<{ productId: string; quantity: number; discount: number }[]>([]);
  itemColumns = ['product', 'quantity', 'price', 'discount', 'subtotal', 'remove'];

  form = this.fb.group({
    customerId: ['', Validators.required],
    items: this.fb.array([])
  });

  get items(): FormArray { return this.form.get('items') as FormArray; }

  ngOnInit(): void {
    this.productSvc.getAll().subscribe({ next: (p) => this.products.set(p) });
    this.addItem();

    this.customerSearchControl.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(value => {
      if (typeof value === 'string') {
        this.form.patchValue({ customerId: '' });
        if (value.length < 3) this.customerSearchResults.set([]);
      }
    });

    this.customerSearchControl.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
      debounceTime(300),
      filter(v => typeof v === 'string' && v.length >= 3),
      switchMap(v => this.customerSvc.search(v as string))
    ).subscribe({
      next: results => this.customerSearchResults.set(results),
      error: () => this.customerSearchResults.set([])
    });
  }

  addItem(): void {
    this.items.push(this.fb.group({
      productId: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      discount: [0, [Validators.min(0)]]
    }));
    this.itemsData.set([...this.items.controls.map(c => c.value)]);
  }

  removeItem(index: number): void {
    if (this.items.length > 1) {
      this.items.removeAt(index);
      this.itemsData.set([...this.items.controls.map(c => c.value)]);
    }
  }

  getProductPrice(productId: string): number {
    return this.products().find(p => p.id === productId)?.price ?? 0;
  }

  getItemSubtotal(index: number): number {
    const item = this.items.at(index).value;
    const price = this.getProductPrice(item.productId);
    return (price * (item.quantity ?? 0)) - (item.discount ?? 0);
  }

  getTotal(): number {
    return this.items.controls.reduce((sum, _, i) => sum + Math.max(0, this.getItemSubtotal(i)), 0);
  }

  displayCustomerFn(customer: ICustomerSearch | null): string {
    return customer ? `${customer.firstName} ${customer.lastName}` : '';
  }

  onCustomerSelected(event: MatAutocompleteSelectedEvent): void {
    const customer = event.option.value as ICustomerSearch;
    this.form.patchValue({ customerId: customer.id });
    this.customerSearchControl.setErrors(null);
  }

  onSubmit(): void {
    if (!this.form.value.customerId) {
      this.customerSearchControl.setErrors({ required: true });
      this.customerSearchControl.markAsTouched();
    }
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const { customerId, items } = this.form.value;
    const subTotal = this.getTotal();
    const payload = {
      customerId,
      subTotal,
      orderItems: (items as any[]).map(item => ({
        productId: item.productId,
        productNameSnapshot: this.products().find(p => p.id === item.productId)?.name ?? '',
        unitPrice: this.getProductPrice(item.productId),
        quantity: item.quantity,
        discount: item.discount ?? 0,
        total: this.getProductPrice(item.productId) * (item.quantity ?? 0) - (item.discount ?? 0)
      }))
    };
    this.orderSvc.create(payload).subscribe({
      next: (order) => {
        this.saving.set(false);
        this.snackBar.open('Pedido criado!', 'Fechar', { duration: 3000 });
        const ref = this.dialog.open(ReceivePaymentDialog, {
          data: { orderId: order.id, orderCode: order.code, orderTotal: order.subTotal },
          width: '440px',
          disableClose: true
        });
        ref.afterClosed().subscribe((result: ReceivePaymentDialogResult | false) => {
          if (result) {
            this.orderSvc.receive(order.id, result.paymentMethodId, result.amount).subscribe({
              next: () => {
                this.snackBar.open('Pagamento registrado!', 'Fechar', { duration: 3000 });
                this.router.navigate(['/pedidos', order.id]);
              },
              error: () => {
                this.snackBar.open('Erro ao registrar pagamento', 'Fechar', { duration: 5000 });
                this.router.navigate(['/pedidos', order.id]);
              }
            });
          } else {
            this.router.navigate(['/pedidos', order.id]);
          }
        });
      },
      error: (err) => { this.saving.set(false); this.snackBar.open(err?.error?.detail ?? 'Erro ao criar pedido', 'Fechar', { duration: 5000 }); }
    });
  }
}
