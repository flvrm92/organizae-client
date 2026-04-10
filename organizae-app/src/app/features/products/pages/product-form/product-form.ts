import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { ProductService } from '../../services/product.service';
import { StatusService } from '../../../../core/services/status.service';
import { UnitOfMeasureService } from '../../../../core/services/unit-of-measure.service';
import { PageHeader } from '../../../../components/page-header/page-header';
import { IStatus } from '../../../../../types/IStatus';
import { IUnitOfMeasure } from '../../../../../types/IUnitOfMeasure';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { AsyncPipe } from '@angular/common';
import { Observable } from 'rxjs';
import { startWith, map, takeUntil } from 'rxjs/operators';
import { CategoryService } from '../../../categories/services/category.service';
import { ICategory } from '../../../../../types/ICategory';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-product-form',
  imports: [ReactiveFormsModule, RouterLink, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatSelectModule, MatAutocompleteModule, AsyncPipe, PageHeader],
  templateUrl: './product-form.html',
  styleUrl: './product-form.css'
})
export class ProductForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly productSvc = inject(ProductService);
  private readonly statusSvc = inject(StatusService);
  private readonly unitOfMeasureSvc = inject(UnitOfMeasureService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly categorySvc = inject(CategoryService);

  private readonly productStatuses = ['Ativo', 'Inativo'];

  constructor(private readonly destroyRef: DestroyRef) { }

  productId = signal<string | null>(null);
  loading = signal(false);
  saving = signal(false);
  isEditMode = signal(false);
  statuses = signal<IStatus[]>([]);
  units = signal<IUnitOfMeasure[]>([]);
  allCategories = signal<ICategory[]>([]);
  rootCategories = signal<ICategory[]>([]);
  subCategories = signal<ICategory[]>([]);

  categoryControl = new FormControl('');
  subCategoryControl = new FormControl('');
  filteredCategories$!: Observable<ICategory[]>;
  filteredSubCategories$!: Observable<ICategory[]>;

  form = this.fb.group({
    code: ['', Validators.required],
    name: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
    price: [0, [Validators.required, Validators.min(0)]],
    statusId: ['', Validators.required],
    unitOfMeasureId: [null as string | null],
    size: [null as string | null],
    color: [null as string | null],
    categoryId: [null as string | null],
    subCategoryId: [null as string | null]
  });

  ngOnInit(): void {
    this.statusSvc.getAll().subscribe(s => this.statuses.set(s.filter(x => this.productStatuses.includes(x.name))));
    this.unitOfMeasureSvc.getAll().subscribe(u => this.units.set(u));
    this.categorySvc.getAll().subscribe(cats => {
      this.allCategories.set(cats);
      this.rootCategories.set(cats.filter(c => !c.parentCategoryId));
      this.setupCategoryAutocomplete();
    });
    const id = this.route.snapshot.paramMap.get('id');
    if (id) { this.productId.set(id); this.isEditMode.set(true); this.loadProduct(id); }
  }

  loadProduct(id: string): void {
    this.loading.set(true);
    this.productSvc.getById(id).subscribe({
      next: (p) => {
        this.form.patchValue({ code: p.code, name: p.name, description: p.description, price: p.price, statusId: p.statusId, unitOfMeasureId: p.unitOfMeasureId, size: p.size, color: p.color, categoryId: p.categoryId, subCategoryId: p.subCategoryId });
        if (p.categoryId) {
          this.categoryControl.setValue(p.categoryName || '');
          this.subCategories.set(this.allCategories().filter(c => c.parentCategoryId === p.categoryId));
          this.setupSubCategoryAutocomplete();
        }
        if (p.subCategoryId) {
          this.subCategoryControl.setValue(p.subCategoryName || '');
        }
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); this.snackBar.open('Erro ao carregar produto', 'Fechar', { duration: 3000 }); this.router.navigate(['/produtos']); }
    });
  }

  setupCategoryAutocomplete(): void {
    this.filteredCategories$ = this.categoryControl.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
      startWith(''),
      map(value => {
        const filterValue = (value || '').toLowerCase();
        return this.rootCategories().filter(c => c.name.toLowerCase().includes(filterValue));
      })
    );
  }

  setupSubCategoryAutocomplete(): void {
    this.filteredSubCategories$ = this.subCategoryControl.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
      startWith(''),
      map(value => {
        const filterValue = (value || '').toLowerCase();
        return this.subCategories().filter(c => c.name.toLowerCase().includes(filterValue));
      })
    );
  }

  displayCategory(category: ICategory): string {
    return category?.name ?? '';
  }

  onCategorySelected(category: ICategory): void {
    this.form.patchValue({ categoryId: category.id, subCategoryId: null });
    this.subCategoryControl.setValue('');
    this.subCategories.set(this.allCategories().filter(c => c.parentCategoryId === category.id));
    this.setupSubCategoryAutocomplete();
  }

  onSubCategorySelected(category: ICategory): void {
    this.form.patchValue({ subCategoryId: category.id });
  }

  clearCategory(): void {
    this.categoryControl.setValue('');
    this.subCategoryControl.setValue('');
    this.form.patchValue({ categoryId: null, subCategoryId: null });
    this.subCategories.set([]);
  }

  clearSubCategory(): void {
    this.subCategoryControl.setValue('');
    this.form.patchValue({ subCategoryId: null });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const payload = this.form.value;
    const obs = this.isEditMode() ? this.productSvc.update(this.productId()!, payload) : this.productSvc.create(payload);
    obs.subscribe({
      next: () => { this.saving.set(false); this.snackBar.open(this.isEditMode() ? 'Produto atualizado!' : 'Produto criado!', 'Fechar', { duration: 3000 }); this.router.navigate(['/produtos']); },
      error: (err) => { this.saving.set(false); const msg = err?.error?.detail ?? 'Erro ao salvar produto'; this.snackBar.open(msg, 'Fechar', { duration: 5000 }); }
    });
  }
}
