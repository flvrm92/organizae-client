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
import { StockService } from '../../services/stock.service';
import { SupplierService } from '../../../suppliers/services/supplier.service';
import { ProductService } from '../../../products/services/product.service';
import { PageHeader } from '../../../../components/page-header/page-header';
import { ISupplierSearch } from '../../../../../types/ISupplierSearch';
import { IProduct } from '../../../../../types/IProduct';

@Component({
  selector: 'app-stock-entry-form',
  imports: [ReactiveFormsModule, RouterLink, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatSelectModule, MatAutocompleteModule, MatProgressSpinnerModule, MatTableModule, MatDividerModule, PageHeader],
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
  private readonly destroyRef = inject(DestroyRef);

  supplierSearchControl = new FormControl('');
  supplierSearchResults = signal<ISupplierSearch[]>([]);
  productSearchControls: FormControl[] = [];
  productSearchResults = signal<IProduct[][]>([]);
  saving = signal(false);
  movementColumns = ['product', 'quantity', 'costPrice', 'remove'];
  itemsData = signal<{ productId: string; quantity: number; costPrice: number }[]>([]);

  form = this.fb.group({
    supplierId: ['', Validators.required],
    movements: this.fb.array([])
  });

  get movements(): FormArray { return this.form.get('movements') as FormArray; }

  ngOnInit(): void {
    this.addMovement();

    this.supplierSearchControl.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(value => {
      if (typeof value === 'string') {
        this.form.patchValue({ supplierId: '' });
        if (value.length < 3) this.supplierSearchResults.set([]);
      }
    });

    this.supplierSearchControl.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
      debounceTime(300),
      filter(v => typeof v === 'string' && v.length >= 3),
      switchMap(v => this.supplierSvc.search(v as string))
    ).subscribe({
      next: results => this.supplierSearchResults.set(results),
      error: () => this.supplierSearchResults.set([])
    });
  }

  addMovement(): void {
    this.movements.push(this.fb.group({
      productId: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      costPrice: [0, [Validators.required, Validators.min(0)]]
    }));
    const index = this.movements.length - 1;
    this.productSearchControls.push(new FormControl(''));
    const results = [...this.productSearchResults()];
    results.push([]);
    this.productSearchResults.set(results);
    this.setupProductSearch(index);
    this.itemsData.set([...this.movements.controls.map(x => x.value)]);
  }

  removeMovement(index: number): void {
    if (this.movements.length > 1) {
      this.movements.removeAt(index);
      this.productSearchControls.splice(index, 1);
      const results = [...this.productSearchResults()];
      results.splice(index, 1);
      this.productSearchResults.set(results);
      this.itemsData.set([...this.movements.controls.map(x => x.value)]);
    }
  }

  private setupProductSearch(index: number): void {
    const control = this.productSearchControls[index];

    control.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(value => {
      if (typeof value === 'string') {
        this.movements.at(index).patchValue({ productId: '' });
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
      switchMap(v => this.productSvc.search(v as string))
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

  displayProductFn(product: IProduct | null): string {
    return product ? `${product.code} — ${product.name}` : '';
  }

  onProductSelected(event: MatAutocompleteSelectedEvent, index: number): void {
    const product = event.option.value as IProduct;
    this.movements.at(index).patchValue({ productId: product.id });
  }

  displaySupplierFn(supplier: ISupplierSearch | null): string {
    return supplier ? supplier.name : '';
  }

  onSupplierSelected(event: MatAutocompleteSelectedEvent): void {
    const supplier = event.option.value as ISupplierSearch;
    this.form.patchValue({ supplierId: supplier.id });
    this.supplierSearchControl.setErrors(null);
  }

  onSubmit(): void {
    if (!this.form.value.supplierId) {
      this.supplierSearchControl.setErrors({ required: true });
      this.supplierSearchControl.markAsTouched();
    }
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
