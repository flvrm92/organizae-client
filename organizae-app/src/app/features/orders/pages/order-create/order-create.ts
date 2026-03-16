import { Component, OnInit, Signal, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
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
import { ICustomer } from '../../../../../types/ICustomer';
import { IProduct } from '../../../../../types/IProduct';

@Component({
  selector: 'app-order-create',
  imports: [ReactiveFormsModule, RouterLink, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatSelectModule, MatProgressSpinnerModule, MatTableModule, MatDividerModule, CurrencyPipe, PageHeader],
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

  customers = signal<ICustomer[]>([]);
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
    this.customerSvc.getAll().subscribe({ next: (c) => this.customers.set(c) });
    this.productSvc.getAll().subscribe({ next: (p) => this.products.set(p) });
    this.addItem();
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

  onSubmit(): void {
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
        this.router.navigate(['/pedidos', order.id]);
      },
      error: (err) => { this.saving.set(false); this.snackBar.open(err?.error?.detail ?? 'Erro ao criar pedido', 'Fechar', { duration: 5000 }); }
    });
  }
}
