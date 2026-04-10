import { Component, inject, ViewChild } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { ThemeToggle } from '../../components/theme-toggle/theme-toggle';
import { AuthService } from '../../auth/services/auth.service';
import { ProgressBar } from '../progress-bar/progress-bar';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-navigation',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatDividerModule,
    ThemeToggle,
    ProgressBar,
  ],
  templateUrl: './navigation.html',
  styleUrl: './navigation.css',
})
export class Navigation {
  @ViewChild('sidenav') sidenav!: MatSidenav;

  private readonly auth = inject(AuthService);
  private readonly breakpointObserver = inject(BreakpointObserver);

  isHandset = false;

  readonly overviewItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
  ];

  readonly cadastroItems: NavItem[] = [
    { label: 'Clientes', icon: 'people', route: '/clientes' },
    { label: 'Fornecedores', icon: 'local_shipping', route: '/fornecedores' },
    { label: 'Produtos', icon: 'inventory_2', route: '/produtos' },
    { label: 'Categorias', icon: 'category', route: '/categorias' },
  ];

  readonly operacaoItems: NavItem[] = [
    { label: 'Pedidos', icon: 'receipt_long', route: '/pedidos' },
    { label: 'Entradas de Estoque', icon: 'add_box', route: '/estoque/entradas' },
    { label: 'Movimentações', icon: 'swap_horiz', route: '/estoque/movimentacoes' },
  ];

  constructor() {
    this.breakpointObserver.observe([Breakpoints.Handset]).subscribe(result => {
      this.isHandset = result.matches;
      if (this.sidenav) {
        if (result.matches) {
          this.sidenav.close();
        } else {
          this.sidenav.open();
        }
      }
    });
  }

  logout(): void {
    this.auth.logout();
  }
}

