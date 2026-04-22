import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe, NgClass } from '@angular/common';
import { Subject, debounceTime } from 'rxjs';
import { IProduct } from '../../../../../types/IProduct';
import { IProductFilterMetadata, IFilterSubcategoryOption } from '../../../../../types/IProductFilterMetadata';
import { IProductListFilters } from '../../../../../types/IProductListFilters';
import { ProductService } from '../../services/product.service';
import { ConfirmDialog } from '../../../../components/confirm-dialog/confirm-dialog';
import { PageHeader } from '../../../../components/page-header/page-header';
import { StatusClassPipe } from '../../../../shared/pipes/status-class.pipe';

interface ActiveChip {
  key: string;
  label: string;
}

@Component({
  selector: 'app-product-list',
  imports: [
    RouterLink,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatPaginatorModule,
    MatSelectModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatChipsModule,
    FormsModule,
    CurrencyPipe,
    NgClass,
    PageHeader,
    StatusClassPipe,
  ],
  templateUrl: './product-list.html',
  styleUrl: './product-list.css',
})
export class ProductList implements OnInit {
  private readonly productSvc = inject(ProductService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchSubject = new Subject<void>();

  products = signal<IProduct[]>([]);
  pagedProducts = signal<IProduct[]>([]);
  loading = signal(false);
  metadata = signal<IProductFilterMetadata | null>(null);

  searchTerm = '';
  selectedCategoryId = '';
  selectedSubcategoryId = '';
  selectedStatusId = '';
  selectedSizes: string[] = [];
  selectedColors: string[] = [];
  selectedTags: string[] = [];

  pageSize = 20;
  pageIndex = 0;
  displayedColumns = ['code', 'name', 'category', 'price', 'unitOfMeasure', 'size', 'color', 'tags', 'status', 'actions'];

  constructor() {
    this.searchSubject.pipe(
      debounceTime(350),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.pageIndex = 0;
      this.loadProducts();
    });
  }

  get availableSubcategories(): IFilterSubcategoryOption[] {
    const cat = this.metadata()?.categories.find(c => c.id === this.selectedCategoryId);
    return cat?.subcategories ?? [];
  }

  get hasActiveFilters(): boolean {
    return (
      !!this.searchTerm.trim() ||
      !!this.selectedCategoryId ||
      !!this.selectedSubcategoryId ||
      !!this.selectedStatusId ||
      this.selectedSizes.length > 0 ||
      this.selectedColors.length > 0 ||
      this.selectedTags.length > 0
    );
  }

  get activeFilterChips(): ActiveChip[] {
    const chips: ActiveChip[] = [];
    const meta = this.metadata();
    if (this.searchTerm.trim()) {
      chips.push({ key: 'search', label: `Busca: "${this.searchTerm.trim()}"` });
    }
    if (this.selectedCategoryId) {
      const cat = meta?.categories.find(c => c.id === this.selectedCategoryId);
      chips.push({ key: 'category', label: `Categoria: ${cat?.name ?? this.selectedCategoryId}` });
    }
    if (this.selectedSubcategoryId) {
      const sub = this.availableSubcategories.find(s => s.id === this.selectedSubcategoryId);
      chips.push({ key: 'subcategory', label: `Subcategoria: ${sub?.name ?? this.selectedSubcategoryId}` });
    }
    if (this.selectedStatusId) {
      const status = meta?.statuses.find(s => s.id === this.selectedStatusId);
      chips.push({ key: 'status', label: `Status: ${status?.name ?? this.selectedStatusId}` });
    }
    for (const size of this.selectedSizes) {
      chips.push({ key: `size:${size}`, label: `Tamanho: ${size}` });
    }
    for (const color of this.selectedColors) {
      chips.push({ key: `color:${color}`, label: `Cor: ${color}` });
    }
    for (const tag of this.selectedTags) {
      chips.push({ key: `tag:${tag}`, label: `Tag: ${tag}` });
    }
    return chips;
  }

  get totalResults(): number {
    return this.products().length;
  }

  ngOnInit(): void {
    this.productSvc.getFilterMetadata().subscribe({
      next: (meta) => {
        this.metadata.set(meta);
        this.loadProducts();
      },
      error: () => {
        this.snackBar.open('Erro ao carregar filtros', 'Fechar', { duration: 3000 });
        this.loadProducts();
      },
    });
  }

  loadProducts(): void {
    this.loading.set(true);
    const filters: IProductListFilters = {
      q: this.searchTerm.trim() || undefined,
      categoryId: this.selectedCategoryId || undefined,
      subcategoryId: this.selectedSubcategoryId || undefined,
      statusId: this.selectedStatusId || undefined,
      sizes: this.selectedSizes,
      colors: this.selectedColors,
      tags: this.selectedTags,
    };
    this.productSvc.getFiltered(filters).subscribe({
      next: (data) => {
        this.products.set(data);
        this.updatePage();
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Erro ao carregar produtos', 'Fechar', { duration: 3000 });
      },
    });
  }

  onSearchInput(): void {
    this.searchSubject.next();
  }

  onFilterChange(): void {
    this.pageIndex = 0;
    this.loadProducts();
  }

  onCategoryChange(): void {
    this.selectedSubcategoryId = '';
    this.onFilterChange();
  }

  removeFilterChip(key: string): void {
    if (key === 'search') {
      this.searchTerm = '';
    } else if (key === 'category') {
      this.selectedCategoryId = '';
      this.selectedSubcategoryId = '';
    } else if (key === 'subcategory') {
      this.selectedSubcategoryId = '';
    } else if (key === 'status') {
      this.selectedStatusId = '';
    } else if (key.startsWith('size:')) {
      const val = key.slice(5);
      this.selectedSizes = this.selectedSizes.filter(s => s !== val);
    } else if (key.startsWith('color:')) {
      const val = key.slice(6);
      this.selectedColors = this.selectedColors.filter(c => c !== val);
    } else if (key.startsWith('tag:')) {
      const val = key.slice(4);
      this.selectedTags = this.selectedTags.filter(t => t !== val);
    }
    this.pageIndex = 0;
    this.loadProducts();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedCategoryId = '';
    this.selectedSubcategoryId = '';
    this.selectedStatusId = '';
    this.selectedSizes = [];
    this.selectedColors = [];
    this.selectedTags = [];
    this.pageIndex = 0;
    this.loadProducts();
  }

  updatePage(): void {
    const start = this.pageIndex * this.pageSize;
    this.pagedProducts.set(this.products().slice(start, start + this.pageSize));
  }

  onPage(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.updatePage();
  }

  deleteProduct(product: IProduct): void {
    const ref = this.dialog.open(ConfirmDialog, {
      data: { title: 'Excluir Produto', message: `Deseja excluir "${product.name}"?`, confirmLabel: 'Excluir' },
      width: '400px',
    });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.productSvc.delete(product.id).subscribe({
        next: () => {
          this.snackBar.open('Produto excluído!', 'Fechar', { duration: 3000 });
          this.loadProducts();
        },
        error: () => this.snackBar.open('Erro ao excluir produto', 'Fechar', { duration: 3000 }),
      });
    });
  }
}
