import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { provideNativeDateAdapter } from '@angular/material/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, filter, switchMap } from 'rxjs';

import { ReportService, FechamentoReportFilters } from '../../services/report.service';
import { CustomerService } from '../../../customers/services/customer.service';
import { ProductService } from '../../../products/services/product.service';
import { CategoryService } from '../../../categories/services/category.service';
import { StatusService } from '../../../../core/services/status.service';
import { PageHeader } from '../../../../components/page-header/page-header';

import { IFechamentoReport, IFechamentoReportRow } from '../../../../../types/IFechamentoReport';
import { IStatus } from '../../../../../types/IStatus';
import { ICategory } from '../../../../../types/ICategory';
import { ICustomerSearch } from '../../../../../types/ICustomerSearch';
import { IProduct } from '../../../../../types/IProduct';

@Component({
  selector: 'app-fechamento',
  standalone: true,
  providers: [provideNativeDateAdapter()],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatChipsModule,
    MatTooltipModule,
    CurrencyPipe,
    DatePipe,
    PageHeader,
  ],
  templateUrl: './fechamento.html',
  styleUrl: './fechamento.css',
})
export class Fechamento implements OnInit {
  private readonly reportSvc = inject(ReportService);
  private readonly customerSvc = inject(CustomerService);
  private readonly productSvc = inject(ProductService);
  private readonly categorySvc = inject(CategoryService);
  private readonly statusSvc = inject(StatusService);
  private readonly destroyRef = inject(DestroyRef);

  // --- Filter form controls ---
  startDate = new FormControl<Date | null>(null);
  endDate = new FormControl<Date | null>(null);
  customerSearchControl = new FormControl('');
  productSearchControl = new FormControl('');
  selectedStatusId = new FormControl<string | null>(null);
  selectedCategoryId = new FormControl<string | null>(null);
  selectedSubcategoryId = new FormControl<string | null>({ value: null, disabled: true });

  // --- Lookup data ---
  statuses = signal<IStatus[]>([]);
  allCategories = signal<ICategory[]>([]);
  topLevelCategories = signal<ICategory[]>([]);
  subcategoryOptions = signal<ICategory[]>([]);

  // --- Autocomplete state ---
  customerResults = signal<ICustomerSearch[]>([]);
  productResults = signal<IProduct[]>([]);
  selectedCustomer = signal<ICustomerSearch | null>(null);
  selectedProduct = signal<IProduct | null>(null);

  // --- Report state ---
  loading = signal(false);
  hasFetched = signal(false);
  report = signal<IFechamentoReport | null>(null);
  errorMessage = signal<string | null>(null);
  expandedRow = signal<IFechamentoReportRow | null>(null);

  readonly displayedColumns = [
    'paymentDate', 'orderCode', 'customerName',
    'paymentMethodName', 'paymentAmount', 'orderSubTotal',
    'statusName', 'expand',
  ];

  // displayWith functions must be arrow properties to retain `this` context in template
  readonly displayCustomer = (c: ICustomerSearch | null): string =>
    c ? `${c.firstName} ${c.lastName}` : '';

  readonly displayProduct = (p: IProduct | null): string =>
    p ? (p.name ?? '') : '';

  get canGenerate(): boolean {
    return !!this.startDate.value && !!this.endDate.value && !this.loading();
  }

  ngOnInit(): void {
    this.statusSvc.getAll().subscribe(s => this.statuses.set(s));

    this.categorySvc.getAll().subscribe(cats => {
      this.allCategories.set(cats);
      this.topLevelCategories.set(cats.filter(c => c.parentCategoryId === null));
    });

    this.customerSearchControl.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
      debounceTime(300),
      filter(v => typeof v === 'string' && v.length >= 2),
      switchMap(v => this.customerSvc.search(v as string)),
    ).subscribe(results => this.customerResults.set(results));

    this.productSearchControl.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
      debounceTime(300),
      filter(v => typeof v === 'string' && v.length >= 2),
      switchMap(v => this.productSvc.search(v as string)),
    ).subscribe(results => this.productResults.set(results));

    this.selectedCategoryId.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(catId => {
      const subs = catId
        ? this.allCategories().filter(c => c.parentCategoryId === catId)
        : [];
      this.subcategoryOptions.set(subs);
      this.selectedSubcategoryId.reset(null, { emitEvent: false });
      if (subs.length > 0) {
        this.selectedSubcategoryId.enable({ emitEvent: false });
      } else {
        this.selectedSubcategoryId.disable({ emitEvent: false });
      }
    });
  }

  onCustomerSelected(customer: ICustomerSearch): void {
    this.selectedCustomer.set(customer);
  }

  onProductSelected(product: IProduct): void {
    this.selectedProduct.set(product);
  }

  clearCustomer(): void {
    this.selectedCustomer.set(null);
    this.customerResults.set([]);
    this.customerSearchControl.setValue('', { emitEvent: false });
  }

  clearProduct(): void {
    this.selectedProduct.set(null);
    this.productResults.set([]);
    this.productSearchControl.setValue('', { emitEvent: false });
  }

  clearFilters(): void {
    this.startDate.reset(null);
    this.endDate.reset(null);
    this.clearCustomer();
    this.clearProduct();
    this.selectedStatusId.reset(null);
    this.selectedCategoryId.reset(null);
    this.selectedSubcategoryId.reset(null);
  }

  generateReport(): void {
    if (!this.canGenerate) return;

    const filters: FechamentoReportFilters = {
      startDate: this.toIsoDate(this.startDate.value!, false),
      endDate: this.toIsoDate(this.endDate.value!, true),
    };

    const customer = this.selectedCustomer();
    if (customer) filters.customerId = customer.id;

    const statusId = this.selectedStatusId.value;
    if (statusId) filters.statusId = statusId;

    const product = this.selectedProduct();
    if (product) filters.productId = product.id;

    const categoryId = this.selectedCategoryId.value;
    if (categoryId) filters.categoryId = categoryId;

    const subcategoryId = this.selectedSubcategoryId.value;
    if (subcategoryId) filters.subcategoryId = subcategoryId;

    this.loading.set(true);
    this.errorMessage.set(null);
    this.expandedRow.set(null);

    this.reportSvc.getFechamento(filters).subscribe({
      next: data => {
        this.report.set(data);
        this.hasFetched.set(true);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Não foi possível gerar o relatório. Verifique os filtros e tente novamente.');
        this.loading.set(false);
        this.hasFetched.set(true);
      },
    });
  }

  toggleRow(row: IFechamentoReportRow): void {
    this.expandedRow.set(this.expandedRow() === row ? null : row);
  }

  isExpanded(row: IFechamentoReportRow): boolean {
    return this.expandedRow() === row;
  }

  private toIsoDate(date: Date, endOfDay: boolean): string {
    const d = new Date(date);
    if (endOfDay) {
      d.setHours(23, 59, 59, 999);
    } else {
      d.setHours(0, 0, 0, 0);
    }
    return d.toISOString();
  }
}
