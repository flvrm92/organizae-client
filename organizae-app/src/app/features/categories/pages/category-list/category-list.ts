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
import { ICategory } from '../../../../../types/ICategory';
import { CategoryService } from '../../services/category.service';
import { ConfirmDialog } from '../../../../components/confirm-dialog/confirm-dialog';
import { PageHeader } from '../../../../components/page-header/page-header';
import { matchesQuery } from '../../../../shared/utils/string-utils';

@Component({
  selector: 'app-category-list',
  imports: [RouterLink, MatTableModule, MatButtonModule, MatIconModule, MatInputModule, MatFormFieldModule, MatPaginatorModule, MatTooltipModule, MatChipsModule, FormsModule, PageHeader],
  templateUrl: './category-list.html',
  styleUrl: './category-list.css'
})
export class CategoryList implements OnInit {
  private readonly categorySvc = inject(CategoryService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  categories = signal<ICategory[]>([]);
  filteredCategories = signal<ICategory[]>([]);
  pagedCategories = signal<ICategory[]>([]);
  loading = signal(false);
  searchTerm = '';
  pageSize = 20;
  pageIndex = 0;
  displayedColumns = ['name', 'parentCategory', 'actions'];

  ngOnInit(): void { this.loadCategories(); }

  loadCategories(): void {
    this.loading.set(true);
    this.categorySvc.getAll().subscribe({
      next: (data) => { this.categories.set(data); this.applyFilter(); this.loading.set(false); },
      error: () => { this.loading.set(false); this.snackBar.open('Erro ao carregar categorias', 'Fechar', { duration: 3000 }); }
    });
  }

  applyFilter(): void {
    const q = this.searchTerm;
    const filtered = q.trim()
      ? this.categories().filter(c => matchesQuery(c.name, q) || matchesQuery(c.parentCategoryName, q))
      : this.categories();
    this.filteredCategories.set(filtered);
    this.pageIndex = 0;
    this.updatePage();
  }

  updatePage(): void {
    const start = this.pageIndex * this.pageSize;
    this.pagedCategories.set(this.filteredCategories().slice(start, start + this.pageSize));
  }

  onPage(event: PageEvent): void { this.pageSize = event.pageSize; this.pageIndex = event.pageIndex; this.updatePage(); }

  deleteCategory(category: ICategory): void {
    const ref = this.dialog.open(ConfirmDialog, {
      data: { title: 'Excluir Categoria', message: `Deseja excluir "${category.name}"?`, confirmLabel: 'Excluir' },
      width: '400px'
    });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.categorySvc.delete(category.id).subscribe({
        next: () => {
          this.categorySvc.refresh();
          this.snackBar.open('Categoria excluída!', 'Fechar', { duration: 3000 });
          this.loadCategories();
        },
        error: () => this.snackBar.open('Erro ao excluir categoria', 'Fechar', { duration: 3000 })
      });
    });
  }
}
