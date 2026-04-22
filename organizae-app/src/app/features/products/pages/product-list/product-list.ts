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
import { CurrencyPipe, NgClass } from '@angular/common';
import { IProduct } from '../../../../../types/IProduct';
import { ProductService } from '../../services/product.service';
import { ConfirmDialog } from '../../../../components/confirm-dialog/confirm-dialog';
import { PageHeader } from '../../../../components/page-header/page-header';
import { StatusClassPipe } from '../../../../shared/pipes/status-class.pipe';
import { matchesQuery } from '../../../../shared/utils/string-utils';

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
    MatTooltipModule,
    MatChipsModule,
    FormsModule,
    CurrencyPipe,
    NgClass,
    PageHeader,
    StatusClassPipe],
  templateUrl: './product-list.html',
  styleUrl: './product-list.css'
})
export class ProductList implements OnInit {
  private readonly productSvc = inject(ProductService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  products = signal<IProduct[]>([]);
  filteredProducts = signal<IProduct[]>([]);
  pagedProducts = signal<IProduct[]>([]);
  loading = signal(false);
  searchTerm = '';
  pageSize = 20;
  pageIndex = 0;
  displayedColumns = ['code', 'name', 'category', 'price', 'unitOfMeasure', 'size', 'color', 'tags', 'status', 'actions'];

  ngOnInit(): void { this.loadProducts(); }

  loadProducts(): void {
    this.loading.set(true);
    this.productSvc.getAll().subscribe({
      next: (data) => { this.products.set(data); this.applyFilter(); this.loading.set(false); },
      error: () => { this.loading.set(false); this.snackBar.open('Erro ao carregar produtos', 'Fechar', { duration: 3000 }); }
    });
  }

  applyFilter(): void {
    const q = this.searchTerm;
    const filtered = q.trim()
      ? this.products().filter(p =>
          matchesQuery(p.name, q) ||
          matchesQuery(p.code?.toString(), q) ||
          matchesQuery(p.categoryName, q) ||
          p.tags?.some(t => matchesQuery(t, q)))
      : this.products();
    this.filteredProducts.set(filtered);
    this.pageIndex = 0;
    this.updatePage();
  }

  updatePage(): void {
    const start = this.pageIndex * this.pageSize;
    this.pagedProducts.set(this.filteredProducts().slice(start, start + this.pageSize));
  }

  onPage(event: PageEvent): void { this.pageSize = event.pageSize; this.pageIndex = event.pageIndex; this.updatePage(); }

  deleteProduct(product: IProduct): void {
    const ref = this.dialog.open(ConfirmDialog, { data: { title: 'Excluir Produto', message: `Deseja excluir "${product.name}"?`, confirmLabel: 'Excluir' }, width: '400px' });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.productSvc.delete(product.id).subscribe({
        next: () => { this.snackBar.open('Produto excluído!', 'Fechar', { duration: 3000 }); this.loadProducts(); },
        error: () => this.snackBar.open('Erro ao excluir produto', 'Fechar', { duration: 3000 })
      });
    });
  }
}
