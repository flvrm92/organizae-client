import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, filter, switchMap } from 'rxjs';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
import { CurrencyPipe } from '@angular/common';
import { OrderService } from '../../services/order.service';
import { CustomerService } from '../../../customers/services/customer.service';
import { ProductService } from '../../../products/services/product.service';
import { PageHeader } from '../../../../components/page-header/page-header';
import { getHighlightSegments, HighlightSegment } from '../../../../shared/utils/highlight-match';
import { ICustomerSearch } from '../../../../../types/ICustomerSearch';
import { IProduct } from '../../../../../types/IProduct';
import { IOrder } from '../../../../../types/IOrder';

@Component({
  selector: 'app-order-edit',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatDividerModule,
    CurrencyPipe,
    PageHeader],
  templateUrl: './order-edit.html',
  styleUrl: './order-edit.css'
})
export class OrderEdit implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly orderSvc = inject(OrderService);
  private readonly customerSvc = inject(CustomerService);
  private readonly productSvc = inject(ProductService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  orderId = '';
  order = signal<IOrder | null>(null);
  loading = signal(false);
  saving = signal(false);

  customerSearchControl = new FormControl('');
  customerSearchResults = signal<ICustomerSearch[]>([]);
  productSearchControls: FormControl[] = [];
  productSearchResults = signal<IProduct[][]>([]);
  selectedProducts = signal<Map<string, IProduct>>(new Map());
  itemsData = signal<any[]>([]);
  itemColumns = ['product', 'quantity', 'price', 'discount', 'subtotal', 'remove'];

  form = this.fb.group({
    customerId: ['', Validators.required],
    comment: ['', Validators.required],
    items: this.fb.array([])
  });

  get items(): FormArray { return this.form.get('items') as FormArray; }

  ngOnInit(): void {
    this.orderId = this.route.snapshot.paramMap.get('id') ?? '';
    if (!this.orderId) {
      this.router.navigate(['/pedidos']);
      return;
    }
    this.loadOrder();

    this.customerSearchControl.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(value => {
      if (typeof value === 'string') {
        this.form.patchValue({ customerId: '' });
        if (value.length < 3)
          this.customerSearchResults.set([]);
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

  private loadOrder(): void {
    this.loading.set(true);
    this.orderSvc.getById(this.orderId).subscribe({
      next: (order) => {
        this.order.set(order);
        if (order.statusName !== 'Ativo') {
          this.snackBar.open('Apenas pedidos ativos podem ser editados', 'Fechar', { duration: 3000 });
          this.router.navigate(['/pedidos', this.orderId]);
          return;
        }
        this.populateForm(order);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Erro ao carregar pedido', 'Fechar', { duration: 3000 });
        this.router.navigate(['/pedidos']);
      }
    });
  }

  private populateForm(order: IOrder): void {
    this.customerSearchControl.setValue(order.customerName);
    this.form.patchValue({ customerId: order.customerId });

    for (const item of order.orderItems ?? []) {
      this.items.push(this.fb.group({
        id: [item.id],
        productId: [item.productId, Validators.required],
        unitPrice: [item.unitPrice, [Validators.required, Validators.min(0.01)]],
        quantity: [item.quantity, [Validators.required, Validators.min(1)]],
        discount: [item.discount, [Validators.min(0)]]
      }));
      const index = this.productSearchControls.length;
      const control = new FormControl(item.productSnapshotName);
      this.productSearchControls.push(control);
      const results = [...this.productSearchResults()];
      results.push([]);
      this.productSearchResults.set(results);

      const map = new Map(this.selectedProducts());
      map.set(item.productId, { id: item.productId, code: 0, name: item.productSnapshotName, price: item.unitPrice } as any);
      this.selectedProducts.set(map);

      this.setupProductSearch(index);
    }
    this.itemsData.set([...this.items.controls.map(c => c.value)]);
  }

  addItem(): void {
    this.items.push(this.fb.group({
      id: [null],
      productId: ['', Validators.required],
      unitPrice: [0, [Validators.required, Validators.min(0.01)]],
      quantity: [1, [Validators.required, Validators.min(1)]],
      discount: [0, [Validators.min(0)]]
    }));
    const index = this.productSearchControls.length;
    this.productSearchControls.push(new FormControl(''));
    const results = [...this.productSearchResults()];
    results.push([]);
    this.productSearchResults.set(results);
    this.setupProductSearch(index);
    this.itemsData.set([...this.items.controls.map(c => c.value)]);
  }

  private setupProductSearch(index: number): void {
    const control = this.productSearchControls[index];

    control.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(value => {
      if (typeof value === 'string') {
        this.items.at(index).patchValue({ productId: '' });
        if (value.length < 3) {
          const results = [...this.productSearchResults()];
          results[index] = [];
          this.productSearchResults.set(results);
        }
      }
    });

    control.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
      debounceTime(300),
      filter(v => typeof v === 'string' && v.length >= 3),
      switchMap(v => this.productSvc.search(v as string, true))
    ).subscribe({
      next: results => {
        const all = [...this.productSearchResults()];
        all[index] = results;
        this.productSearchResults.set(all);
      },
      error: () => {
        const all = [...this.productSearchResults()];
        all[index] = [];
        this.productSearchResults.set(all);
      }
    });
  }

  removeItem(index: number): void {
    if (this.items.length > 1) {
      this.items.removeAt(index);
      this.productSearchControls.splice(index, 1);
      const results = [...this.productSearchResults()];
      results.splice(index, 1);
      this.productSearchResults.set(results);
      this.itemsData.set([...this.items.controls.map(c => c.value)]);
    }
  }

  getItemSubtotal(index: number): number {
    const item = this.items.at(index).value;
    return ((item.unitPrice ?? 0) * (item.quantity ?? 0)) - (item.discount ?? 0);
  }

  getTotal(): number {
    return this.items.controls.reduce((sum, _, i) => sum + Math.max(0, this.getItemSubtotal(i)), 0);
  }

  displayCustomerFn(customer: ICustomerSearch | string | null): string {
    if (!customer) return '';
    if (typeof customer === 'string') return customer;
    return `${customer.firstName} ${customer.lastName}`;
  }

  displayProductFn(product: IProduct | string | null): string {
    if (!product) return '';
    if (typeof product === 'string') return product;
    return `${product.code} — ${product.name}`;
  }

  highlightProductName(name: string | null | undefined, query: unknown): HighlightSegment[] {
    return getHighlightSegments(name, query);
  }

  onProductSelected(event: MatAutocompleteSelectedEvent, index: number): void {
    const product = event.option.value as IProduct;
    this.items.at(index).patchValue({ productId: product.id, unitPrice: product.price });
    const map = new Map(this.selectedProducts());
    map.set(product.id, product);
    this.selectedProducts.set(map);
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
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const { customerId, comment, items } = this.form.value;
    const payload = {
      customerId,
      subTotal: this.getTotal(),
      comment,
      orderItems: (items as any[]).map(item => ({
        id: item.id || undefined,
        productId: item.productId,
        productNameSnapshot: this.selectedProducts().get(item.productId)?.name ?? '',
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        discount: item.discount ?? 0,
        total: (item.unitPrice ?? 0) * (item.quantity ?? 0) - (item.discount ?? 0)
      }))
    };
    this.orderSvc.update(this.orderId, payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.snackBar.open('Pedido atualizado!', 'Fechar', { duration: 3000 });
        this.router.navigate(['/pedidos', this.orderId]);
      },
      error: (err) => {
        this.saving.set(false);
        this.snackBar.open(err?.error?.detail ?? 'Erro ao atualizar pedido', 'Fechar', { duration: 5000 });
      }
    });
  }
}
