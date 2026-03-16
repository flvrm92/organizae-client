import { Component, OnInit, inject, signal } from '@angular/core';
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
import { StockService } from '../../services/stock.service';
import { SupplierService } from '../../../suppliers/services/supplier.service';
import { ProductService } from '../../../products/services/product.service';
import { PageHeader } from '../../../../components/page-header/page-header';
import { ISupplier } from '../../../../../types/ISupplier';
import { IProduct } from '../../../../../types/IProduct';

@Component({
  selector: 'app-stock-entry-form',
  imports: [ReactiveFormsModule, RouterLink, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatSelectModule, MatProgressSpinnerModule, MatTableModule, MatDividerModule, PageHeader],
  templateUrl: './stock-entry-form.html',
  styleUrl: './stock-entry-form.css'
})
export class StockEntryForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly stockSvc = inject(StockService);
  private readonly supplierSvc = inject(SupplierService);
  private readonly productSvc = inject(ProductService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  suppliers = signal<ISupplier[]>([]);
  products = signal<IProduct[]>([]);
  saving = signal(false);
  movementColumns = ['product', 'quantity', 'costPrice', 'remove'];
  itemsData = signal<{ productId: string; quantity: number; costPrice: number }[]>([]);

  form = this.fb.group({
    supplierId: ['', Validators.required],
    movements: this.fb.array([])
  });

  get movements(): FormArray { return this.form.get('movements') as FormArray; }

  ngOnInit(): void {
    this.supplierSvc.getAll().subscribe({ next: (s) => this.suppliers.set(s) });
    this.productSvc.getAll().subscribe({ next: (p) => this.products.set(p) });
    this.addMovement();
  }

  addMovement(): void {
    this.movements.push(this.fb.group({
      productId: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      costPrice: [0, [Validators.required, Validators.min(0)]]
    }));
    this.itemsData.set([...this.movements.controls.map(x => x.value)]);
  }

  removeMovement(index: number): void {
    if (this.movements.length > 1)
      this.movements.removeAt(index);
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const payload = {
      supplierId: this.form.value.supplierId!,
      items: this.movements.controls.map(c => c.value)
    };
    this.stockSvc.createEntry(payload).subscribe({
      next: (entry) => {
        this.saving.set(false);
        this.snackBar.open('Entrada criada!', 'Fechar', { duration: 3000 });
        this.router.navigate(['/estoque/entradas', entry.id]);
      },
      error: (err) => {
        this.saving.set(false);
        this.snackBar.open(err?.error?.detail ?? 'Erro ao criar entrada', 'Fechar', { duration: 5000 });
      }
    });
  }
}
