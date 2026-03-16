import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NgxChartsModule, Color, ScaleType, LegendPosition } from '@swimlane/ngx-charts';
import { DashboardService, DashboardStats } from '../../services/dashboard.service';
import { PageHeader } from '../../../../components/page-header/page-header';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    MatCardModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatDividerModule,
    NgxChartsModule,
    PageHeader
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly snackBar = inject(MatSnackBar);

  loading = signal(true);
  stats = signal<DashboardStats | null>(null);

  colorScheme: Color = {
    name: 'organizae',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#1976D2', '#43A047', '#FB8C00', '#E53935', '#8E24AA']
  };

  legendPosition = LegendPosition.Below;

  ngOnInit() {
    this.loadStats();
  }

  loadStats() {
    this.loading.set(true);
    this.dashboardService.getStats().subscribe({
      next: data => {
        this.stats.set(data);
        this.loading.set(false);
      },
      error: err => {
        this.snackBar.open(err?.error?.detail ?? 'Erro ao carregar o painel', 'Fechar', { duration: 4000 });
        this.loading.set(false);
      }
    });
  }
}
