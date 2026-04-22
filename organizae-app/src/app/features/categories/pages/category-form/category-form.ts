import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { AsyncPipe } from '@angular/common';
import { startWith, map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { CategoryService } from '../../services/category.service';
import { normalize } from '../../../../shared/utils/string-utils';
import { PageHeader } from '../../../../components/page-header/page-header';
import { ICategory } from '../../../../../types/ICategory';

@Component({
  selector: 'app-category-form',
  imports: [ReactiveFormsModule, RouterLink, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatAutocompleteModule, PageHeader, AsyncPipe],
  templateUrl: './category-form.html',
  styleUrl: './category-form.css'
})
export class CategoryForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly categorySvc = inject(CategoryService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  categoryId = signal<string | null>(null);
  loading = signal(false);
  saving = signal(false);
  isEditMode = signal(false);
  rootCategories = signal<ICategory[]>([]);

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    parentCategoryId: [null as string | null]
  });

  parentCategoryControl = new FormControl('');
  filteredCategories$!: Observable<ICategory[]>;

  ngOnInit(): void {
    this.loadRootCategories();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) { this.categoryId.set(id); this.isEditMode.set(true); this.loadCategory(id); }
  }

  loadRootCategories(): void {
    this.categorySvc.getAll().subscribe(cats => {
      const roots = cats.filter(c => !c.parentCategoryId);
      this.rootCategories.set(roots);
      this.setupAutocomplete();
    });
  }

  setupAutocomplete(): void {
    this.filteredCategories$ = this.parentCategoryControl.valueChanges.pipe(
      startWith(''),
      map(value => this.filterCategories(value || ''))
    );
  }

  filterCategories(value: string): ICategory[] {
    const filterValue = normalize(value);
    const currentId = this.categoryId();
    return this.rootCategories().filter(c =>
      normalize(c.name).includes(filterValue) && c.id !== currentId
    );
  }

  displayCategory(category: ICategory): string {
    return category?.name ?? '';
  }

  onParentSelected(category: ICategory): void {
    this.form.patchValue({ parentCategoryId: category.id });
  }

  clearParent(): void {
    this.parentCategoryControl.setValue('');
    this.form.patchValue({ parentCategoryId: null });
  }

  loadCategory(id: string): void {
    this.loading.set(true);
    this.categorySvc.getById(id).subscribe({
      next: (c) => {
        this.form.patchValue({ name: c.name, parentCategoryId: c.parentCategoryId });
        if (c.parentCategoryId && c.parentCategoryName) {
          this.parentCategoryControl.setValue(c.parentCategoryName);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Erro ao carregar categoria', 'Fechar', { duration: 3000 });
        this.router.navigate(['/categorias']);
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const payload = this.form.value;
    const obs = this.isEditMode()
      ? this.categorySvc.update(this.categoryId()!, payload)
      : this.categorySvc.create(payload);
    obs.subscribe({
      next: () => {
        this.categorySvc.refresh();
        this.saving.set(false);
        this.snackBar.open(this.isEditMode() ? 'Categoria atualizada!' : 'Categoria criada!', 'Fechar', { duration: 3000 });
        this.router.navigate(['/categorias']);
      },
      error: (err) => {
        this.saving.set(false);
        const msg = err?.error?.detail ?? 'Erro ao salvar categoria';
        this.snackBar.open(msg, 'Fechar', { duration: 5000 });
      }
    });
  }
}
