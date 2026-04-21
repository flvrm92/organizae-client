import { Component, DestroyRef, OnInit, inject, signal, computed, effect } from '@angular/core';
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
import { OrganizationStore } from '../../../../core/services/organization.store';
import { PageHeader } from '../../../../components/page-header/page-header';
import { IStatus } from '../../../../../types/IStatus';
import { IUnitOfMeasure } from '../../../../../types/IUnitOfMeasure';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatChipsModule, MatChipInputEvent } from '@angular/material/chips';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { AsyncPipe } from '@angular/common';
import { Observable } from 'rxjs';
import { startWith, map } from 'rxjs/operators';
import { CategoryService } from '../../../categories/services/category.service';
import { ICategory } from '../../../../../types/ICategory';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export type PricingEditSource = 'costOrGain' | 'price';

@Component({
  selector: 'app-product-form',
  imports: [ReactiveFormsModule, RouterLink, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatSelectModule, MatAutocompleteModule, MatChipsModule, AsyncPipe, PageHeader],
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
  private readonly orgStore = inject(OrganizationStore);

  private readonly productStatuses = ['Ativo', 'Inativo'];

  /** Guards programmatic pricing updates from triggering cascading valueChanges. */
  private _updatingPricing = false;

  /**
   * Tracks whether gainPercentage has already been seeded from the org default.
   * Prevents re-seeding if the org config signal updates again after the first load.
   */
  private _gainSeeded = false;

  constructor(private readonly destroyRef: DestroyRef) {
    // One-time seed: apply the org default gain percentage to a new product form
    // only once the config finishes loading (defaultGainPercentage transitions null → number).
    // Using effect() so the seed is deferred until the config signal is available,
    // even if that happens after ngOnInit completes.
    effect(() => {
      const defaultGain = this.orgStore.defaultGainPercentage();
      if (!this.isEditMode() && !this._gainSeeded && defaultGain !== null) {
        this._gainSeeded = true;
        const gainCtrl = this.form.get('gainPercentage')!;
        // Only seed when the field is still in its initial untouched-null state.
        // If the user already typed a value, pristine is false or value is non-null;
        // in that case we must not overwrite what they entered.
        if (gainCtrl.pristine && gainCtrl.value === null) {
          this.form.patchValue({ gainPercentage: defaultGain }, { emitEvent: false });
          // If costPrice was already entered before the org default arrived,
          // recalculate price so the three fields stay coherent.
          const cost = this.toNum(this.form.get('costPrice')!.value);
          if (cost > 0) {
            this._updatingPricing = true;
            this.form.get('price')!.setValue(this.calcPrice(cost, defaultGain), { emitEvent: false });
            this._updatingPricing = false;
            this.pricingEditSource.set('costOrGain');
          }
        }
      }
    });
  }

  // ── General state ────────────────────────────────────────────────────────────

  productId = signal<string | null>(null);
  loading = signal(false);
  saving = signal(false);
  isEditMode = signal(false);
  statuses = signal<IStatus[]>([]);
  units = signal<IUnitOfMeasure[]>([]);
  allCategories = signal<ICategory[]>([]);
  rootCategories = signal<ICategory[]>([]);
  subCategories = signal<ICategory[]>([]);
  tags = signal<string[]>([]);
  readonly separatorKeyCodes = [ENTER, COMMA] as const;

  // ── Pricing state (template hooks) ───────────────────────────────────────────

  /**
   * True when costPrice > 0 — enables direct price editing.
   * When false the price input should be read-only and the hint should be shown.
   */
  priceEditable = signal(false);

  /**
   * Tracks whether the last pricing edit came from the cost/gain side or from
   * the price side. Sent to the backend as `pricingEditSource`.
   */
  pricingEditSource = signal<PricingEditSource>('costOrGain');

  /**
   * Mirrors the organization's stored default gain percentage.
   * Null while the config has not yet been fetched.
   * The template can display a "padrão da loja: X%" hint when this is set.
   */
  readonly orgDefaultGain = computed(() => this.orgStore.defaultGainPercentage());

  /**
   * True in create mode while the org config is still being fetched.
   * The template uses this to show a loading indicator on the gainPercentage
   * field and to communicate that the store default is not yet known.
   * Also used by onSubmit to prevent accidentally saving gainPercentage: 0
   * before the real default arrives.
   */
  readonly awaitingOrgDefault = computed(() =>
    !this.isEditMode() && this.orgStore.defaultGainPercentage() === null
  );

  // ── Category autocomplete controls ───────────────────────────────────────────

  categoryControl = new FormControl('');
  subCategoryControl = new FormControl('');
  filteredCategories$!: Observable<ICategory[]>;
  filteredSubCategories$!: Observable<ICategory[]>;

  // ── Reactive form ─────────────────────────────────────────────────────────────

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
    // price: 2 decimal places; editable directly only when costPrice > 0
    price: [0, [Validators.required, Validators.min(0)]],
    // costPrice / gainPercentage: up to 4 decimal places
    costPrice: [0, [Validators.required, Validators.min(0)]],
    // null in create mode until the org default is seeded — keeps the field blank
    // rather than showing a misleading 0. loadProduct always supplies a real number.
    gainPercentage: [null as number | null, [Validators.required, Validators.min(0)]],
    statusId: ['', Validators.required],
    unitOfMeasureId: [null as string | null],
    size: [null as string | null],
    color: [null as string | null],
    categoryId: [null as string | null],
    subCategoryId: [null as string | null]
  });

  // ── Lifecycle ─────────────────────────────────────────────────────────────────

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
    this.setupPricingListeners();
  }

  loadProduct(id: string): void {
    this.loading.set(true);
    this.productSvc.getById(id).subscribe({
      next: (p) => {
        const costPrice = p.costPrice ?? 0;
        const gainPercentage = p.gainPercentage ?? 0;
        this.form.patchValue({
          name: p.name,
          description: p.description,
          price: p.price,
          costPrice,
          gainPercentage,
          statusId: p.statusId,
          unitOfMeasureId: p.unitOfMeasureId,
          size: p.size,
          color: p.color,
          categoryId: p.categoryId,
          subCategoryId: p.subCategoryId
        });
        this.priceEditable.set(costPrice > 0);
        if (p.categoryId) {
          this.categoryControl.setValue(p.categoryName || '');
          this.subCategories.set(this.allCategories().filter(c => c.parentCategoryId === p.categoryId));
          this.setupSubCategoryAutocomplete();
        }
        if (p.subCategoryId) {
          this.subCategoryControl.setValue(p.subCategoryName || '');
        }
        this.tags.set(p.tags ?? []);
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); this.snackBar.open('Erro ao carregar produto', 'Fechar', { duration: 3000 }); this.router.navigate(['/produtos']); }
    });
  }

  // ── Pricing logic ─────────────────────────────────────────────────────────────

  /**
   * Wires up the three pricing controls so they stay consistent with the formula:
   *   Price = CostPrice × (1 + GainPercentage / 100)
   *
   * Feedback loops are prevented by:
   * 1. Setting dependent controls with `{ emitEvent: false }`.
   * 2. The `_updatingPricing` re-entry guard for any synchronous cascades.
   */
  private setupPricingListeners(): void {
    const costPriceCtrl = this.form.get('costPrice')!;
    const gainPercentageCtrl = this.form.get('gainPercentage')!;
    const priceCtrl = this.form.get('price')!;

    // costPrice changes → recalculate price; update editability state.
    costPriceCtrl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(rawCost => {
      if (this._updatingPricing) return;
      const cost = this.toNum(rawCost);
      const gain = this.toNum(gainPercentageCtrl.value);
      this.priceEditable.set(cost > 0);
      this.pricingEditSource.set('costOrGain');
      this._updatingPricing = true;
      priceCtrl.setValue(this.calcPrice(cost, gain), { emitEvent: false });
      this._updatingPricing = false;
    });

    // gainPercentage changes → recalculate price.
    gainPercentageCtrl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(rawGain => {
      if (this._updatingPricing) return;
      const cost = this.toNum(costPriceCtrl.value);
      const gain = this.toNum(rawGain);
      this.pricingEditSource.set('costOrGain');
      this._updatingPricing = true;
      priceCtrl.setValue(this.calcPrice(cost, gain), { emitEvent: false });
      this._updatingPricing = false;
    });

    // price changes → recalculate gainPercentage (only valid when costPrice > 0).
    // If the manually entered price is below cost the form becomes invalid instead
    // of silently clamping gain to 0.
    priceCtrl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(rawPrice => {
      if (this._updatingPricing) return;
      const cost = this.toNum(costPriceCtrl.value);
      if (cost <= 0) return;
      const price = this.toNum(rawPrice);
      this.pricingEditSource.set('price');
      if (price < cost) {
        priceCtrl.setErrors({ ...priceCtrl.errors, priceBelowCost: true });
        return;
      }
      this._updatingPricing = true;
      gainPercentageCtrl.setValue(this.calcGainPercentage(cost, price), { emitEvent: false });
      this._updatingPricing = false;
    });
  }

  /** Price = CostPrice × (1 + GainPercentage / 100), rounded to 2 decimal places. */
  private calcPrice(costPrice: number, gainPercentage: number): number {
    return Math.round(costPrice * (1 + gainPercentage / 100) * 100) / 100;
  }

  /**
   * GainPercentage = (Price / CostPrice − 1) × 100, rounded to 4 decimal places.
   * Only called when price >= costPrice (the listener returns early otherwise).
   */
  private calcGainPercentage(costPrice: number, price: number): number {
    const raw = (price / costPrice - 1) * 100;
    return Math.round(raw * 10000) / 10000;
  }

  /** Coerces a form control value (may be null / string during typing) to a number. */
  private toNum(value: unknown): number {
    return parseFloat(String(value ?? 0)) || 0;
  }

  // ── Category autocomplete ─────────────────────────────────────────────────────

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

  // ── Tags ──────────────────────────────────────────────────────────────────────

  addTag(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value && !this.tags().includes(value)) {
      this.tags.update(tags => [...tags, value]);
    }
    event.chipInput!.clear();
  }

  removeTag(tag: string): void {
    this.tags.update(tags => tags.filter(t => t !== tag));
  }

  // ── Submit ────────────────────────────────────────────────────────────────────

  onSubmit(): void {
    // Check org default first — if still loading, the gainPercentage control is null
    // (required-invalid), so checking form.invalid first would show a misleading
    // "campo obrigatório" error on the gain field instead of a meaningful message.
    if (this.awaitingOrgDefault()) {
      this.snackBar.open('Aguardando configuração padrão da loja. Tente novamente em instantes.', 'Fechar', { duration: 4000 });
      return;
    }
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const payload = {
      ...this.form.value,
      tags: this.tags(),
      pricingEditSource: this.pricingEditSource()
    };
    const obs = this.isEditMode() ? this.productSvc.update(this.productId()!, payload) : this.productSvc.create(payload);
    obs.subscribe({
      next: () => { this.saving.set(false); this.snackBar.open(this.isEditMode() ? 'Produto atualizado!' : 'Produto criado!', 'Fechar', { duration: 3000 }); this.router.navigate(['/produtos']); },
      error: (err) => {
        this.saving.set(false);
        // The API can return a plain string body (e.g. 400 pricing errors),
        // a problem-details object with `.detail`, or nothing.
        let msg = 'Erro ao salvar produto';
        if (typeof err?.error === 'string' && err.error.trim()) {
          msg = err.error.trim();
        } else if (err?.error?.detail) {
          msg = err.error.detail;
        } else if (err?.error?.message) {
          msg = err.error.message;
        }
        this.snackBar.open(msg, 'Fechar', { duration: 5000 });
      }
    });
  }
}
