import { Component, OnInit, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { DecimalPipe } from '@angular/common';
import { signal } from '@angular/core';
import { StockService } from '../../services/stock.service';
import { PageHeader } from '../../../../components/page-header/page-header';
import { IStockMovementProductSummary } from '../../../../../types/IStockMovement';

@Component({
  selector: 'app-stock-movement',
  providers: [provideNativeDateAdapter()],
  imports: [
    ReactiveFormsModule,
    MatCardModule, MatTableModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatPaginatorModule,
    MatFormFieldModule, MatInputModule, MatDatepickerModule,
    DecimalPipe, PageHeader
  ],
  templateUrl: './stock-movement.html',
  styleUrl: './stock-movement.css'
})
export class StockMovement implements OnInit {
  private readonly stockSvc = inject(StockService);
  private readonly snackBar = inject(MatSnackBar);

  movements = signal<IStockMovementProductSummary[]>([]);
  pagedMovements = signal<IStockMovementProductSummary[]>([]);
  loading = signal(false);
  pageSize = 20;
  pageIndex = 0;
  startDate = new FormControl<Date | null>(null);
  endDate = new FormControl<Date | null>(null);
  displayedColumns = ['productName', 'totalIn', 'totalOut', 'currentStock'];

  ngOnInit(): void {
    this.loadMovements();
  }

  private formatDate(date: Date | null, endOfDay: boolean): string | undefined {
    if (!date) return undefined;
    const d = new Date(date);
    if (endOfDay) {
      d.setHours(23, 59, 59, 999);
    } else {
      d.setHours(0, 0, 0, 0);
    }
    return d.toISOString();
  }

  loadMovements(): void {
    this.loading.set(true);
    const start = this.formatDate(this.startDate.value, false);
    const end = this.formatDate(this.endDate.value, true);
    this.stockSvc.getMovementSummary(start, end).subscribe({
      next: (data) => {
        this.movements.set(data);
        this.updatePage();
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Erro ao carregar movimentações', 'Fechar', { duration: 3000 });
      }
    });
  }

  filter(): void {
    this.pageIndex = 0;
    this.loadMovements();
  }

  clearFilter(): void {
    this.startDate.reset();
    this.endDate.reset();
    this.pageIndex = 0;
    this.loadMovements();
  }

  updatePage(): void {
    const start = this.pageIndex * this.pageSize;
    this.pagedMovements.set(this.movements().slice(start, start + this.pageSize));
  }

  onPage(event: PageEvent): void { this.pageSize = event.pageSize; this.pageIndex = event.pageIndex; this.updatePage(); }
}

