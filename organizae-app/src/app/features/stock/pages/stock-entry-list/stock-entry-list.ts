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
import { DatePipe } from '@angular/common';
import { IStockEntry } from '../../../../../types/IStockEntry';
import { StockService } from '../../services/stock.service';
import { ConfirmDialog } from '../../../../components/confirm-dialog/confirm-dialog';
import { PageHeader } from '../../../../components/page-header/page-header';

@Component({
  selector: 'app-stock-entry-list',
  imports: [RouterLink, MatTableModule, MatButtonModule, MatIconModule, MatInputModule, MatFormFieldModule, MatPaginatorModule, MatTooltipModule, FormsModule, DatePipe, PageHeader],
  templateUrl: './stock-entry-list.html',
  styleUrl: './stock-entry-list.css'
})
export class StockEntryList implements OnInit {
  private readonly stockSvc = inject(StockService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  entries = signal<IStockEntry[]>([]);
  pagedEntries = signal<IStockEntry[]>([]);
  loading = signal(false);
  pageSize = 20;
  pageIndex = 0;
  displayedColumns = ['code', 'supplierName', 'movementsCount', 'createdAt', 'actions'];

  ngOnInit(): void { this.loadEntries(); }

  loadEntries(): void {
    this.loading.set(true);
    this.stockSvc.getAllEntries().subscribe({
      next: (data) => { this.entries.set(data); this.updatePage(); this.loading.set(false); },
      error: () => { this.loading.set(false); this.snackBar.open('Erro ao carregar entradas de estoque', 'Fechar', { duration: 3000 }); }
    });
  }

  updatePage(): void {
    const start = this.pageIndex * this.pageSize;
    this.pagedEntries.set(this.entries().slice(start, start + this.pageSize));
  }

  onPage(event: PageEvent): void { this.pageSize = event.pageSize; this.pageIndex = event.pageIndex; this.updatePage(); }

  deleteEntry(entry: IStockEntry): void {
    const ref = this.dialog.open(ConfirmDialog, { data: { title: 'Excluir Entrada', message: `Deseja excluir a entrada #${entry.id.substring(0, 8)}...?`, confirmLabel: 'Excluir' }, width: '400px' });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.stockSvc.deleteEntry(entry.id).subscribe({
        next: () => { this.snackBar.open('Entrada excluída!', 'Fechar', { duration: 3000 }); this.loadEntries(); },
        error: () => this.snackBar.open('Erro ao excluir entrada', 'Fechar', { duration: 3000 })
      });
    });
  }
}

