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
import { ICustomer } from '../../../../../types/ICustomer';
import { CustomerService } from '../../services/customer.service';
import { ConfirmDialog } from '../../../../components/confirm-dialog/confirm-dialog';
import { PageHeader } from '../../../../components/page-header/page-header';
import { matchesQuery } from '../../../../shared/utils/string-utils';

@Component({
  selector: 'app-customer-list',
  imports: [
    RouterLink,
    MatTableModule, MatButtonModule, MatIconModule, MatInputModule,
    MatFormFieldModule, MatPaginatorModule, MatTooltipModule, FormsModule,
    PageHeader
  ],
  templateUrl: './customer-list.html',
  styleUrl: './customer-list.css'
})
export class CustomerList implements OnInit {
  private readonly customerSvc = inject(CustomerService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  customers = signal<ICustomer[]>([]);
  filteredCustomers = signal<ICustomer[]>([]);
  pagedCustomers = signal<ICustomer[]>([]);
  loading = signal(false);
  searchTerm = '';
  pageSize = 20;
  pageIndex = 0;
  displayedColumns = ['fullName', 'cellPhone', 'email', 'document', 'actions'];

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.loading.set(true);
    this.customerSvc.getAll().subscribe({
      next: (data) => {
        this.customers.set(data);
        this.applyFilter();
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Erro ao carregar clientes', 'Fechar', { duration: 3000 });
      }
    });
  }

  applyFilter(): void {
    const q = this.searchTerm;
    const filtered = q.trim()
      ? this.customers().filter(c =>
        matchesQuery(`${c.firstName ?? ''} ${c.lastName ?? ''}`, q) ||
        matchesQuery(c.email, q) ||
        matchesQuery(c.document, q))
      : this.customers();
    this.filteredCustomers.set(filtered);
    this.pageIndex = 0;
    this.updatePage();
  }

  updatePage(): void {
    const start = this.pageIndex * this.pageSize;
    this.pagedCustomers.set(this.filteredCustomers().slice(start, start + this.pageSize));
  }

  onPage(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.updatePage();
  }

  deleteCustomer(customer: ICustomer): void {
    const ref = this.dialog.open(ConfirmDialog, {
      data: { title: 'Excluir Cliente', message: `Deseja excluir o cliente "${customer.firstName} ${customer.lastName ?? ''}"?`, confirmLabel: 'Excluir' },
      width: '400px'
    });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.customerSvc.delete(customer.id).subscribe({
        next: () => {
          this.snackBar.open('Cliente excluído com sucesso', 'Fechar', { duration: 3000 });
          this.loadCustomers();
        },
        error: () => this.snackBar.open('Erro ao excluir cliente', 'Fechar', { duration: 3000 })
      });
    });
  }
}
