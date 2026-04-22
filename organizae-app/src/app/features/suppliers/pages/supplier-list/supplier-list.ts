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
import { FormsModule } from '@angular/forms';
import { ISupplier } from '../../../../../types/ISupplier';
import { SupplierService } from '../../services/supplier.service';
import { ConfirmDialog } from '../../../../components/confirm-dialog/confirm-dialog';
import { PageHeader } from '../../../../components/page-header/page-header';
import { matchesQuery } from '../../../../shared/utils/string-utils';

@Component({
  selector: 'app-supplier-list',
  imports: [RouterLink, MatTableModule, MatButtonModule, MatIconModule, MatInputModule, MatFormFieldModule, MatPaginatorModule, MatTooltipModule, FormsModule, PageHeader],
  templateUrl: './supplier-list.html',
  styleUrl: './supplier-list.css'
})
export class SupplierList implements OnInit {
  private readonly supplierSvc = inject(SupplierService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  suppliers = signal<ISupplier[]>([]);
  filteredSuppliers = signal<ISupplier[]>([]);
  pagedSuppliers = signal<ISupplier[]>([]);
  loading = signal(false);
  searchTerm = '';
  pageSize = 20;
  pageIndex = 0;
  displayedColumns = ['name', 'email', 'phone', 'document', 'actions'];

  ngOnInit(): void { this.loadSuppliers(); }

  loadSuppliers(): void {
    this.loading.set(true);
    this.supplierSvc.getAll().subscribe({
      next: (data) => { this.suppliers.set(data); this.applyFilter(); this.loading.set(false); },
      error: () => { this.loading.set(false); this.snackBar.open('Erro ao carregar fornecedores', 'Fechar', { duration: 3000 }); }
    });
  }

  applyFilter(): void {
    const q = this.searchTerm;
    const filtered = q.trim()
      ? this.suppliers().filter(s => matchesQuery(s.name, q) || matchesQuery(s.email, q))
      : this.suppliers();
    this.filteredSuppliers.set(filtered);
    this.pageIndex = 0;
    this.updatePage();
  }

  updatePage(): void {
    const start = this.pageIndex * this.pageSize;
    this.pagedSuppliers.set(this.filteredSuppliers().slice(start, start + this.pageSize));
  }

  onPage(event: PageEvent): void { this.pageSize = event.pageSize; this.pageIndex = event.pageIndex; this.updatePage(); }

  deleteSupplier(supplier: ISupplier): void {
    const ref = this.dialog.open(ConfirmDialog, { data: { title: 'Excluir Fornecedor', message: `Deseja excluir "${supplier.name}"?`, confirmLabel: 'Excluir' }, width: '400px' });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.supplierSvc.delete(supplier.id).subscribe({
        next: () => { this.snackBar.open('Fornecedor excluído!', 'Fechar', { duration: 3000 }); this.loadSuppliers(); },
        error: () => this.snackBar.open('Erro ao excluir fornecedor', 'Fechar', { duration: 3000 })
      });
    });
  }
}
