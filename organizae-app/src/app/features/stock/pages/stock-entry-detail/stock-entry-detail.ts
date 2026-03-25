import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { IStockEntry } from '../../../../../types/IStockEntry';
import { StockService } from '../../services/stock.service';
import { PageHeader } from '../../../../components/page-header/page-header';

@Component({
  selector: 'app-stock-entry-detail',
  imports: [MatCardModule, MatButtonModule, MatIconModule, MatTableModule, MatProgressSpinnerModule, CurrencyPipe, DatePipe, PageHeader],
  templateUrl: './stock-entry-detail.html',
  styleUrl: './stock-entry-detail.css'
})
export class StockEntryDetail implements OnInit {
  private readonly stockSvc = inject(StockService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  entry = signal<IStockEntry | null>(null);
  loading = signal(false);
  movColumns = ['productId', 'quantity', 'value'];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadEntry(id);
    else this.router.navigate(['/estoque/entradas']);
  }

  loadEntry(id: string): void {
    this.loading.set(true);
    this.stockSvc.getEntryById(id).subscribe({
      next: (e) => { this.entry.set(e); this.loading.set(false); },
      error: () => { this.loading.set(false); this.snackBar.open('Erro ao carregar entrada', 'Fechar', { duration: 3000 }); this.router.navigate(['/estoque/entradas']); }
    });
  }
}

