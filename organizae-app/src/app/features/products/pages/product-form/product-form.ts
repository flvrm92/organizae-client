import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { PageHeader } from '../../../../components/page-header/page-header';

@Component({
  selector: 'app-product-form',
  imports: [ReactiveFormsModule, RouterLink, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatSelectModule, PageHeader],
  templateUrl: './product-form.html',
  styleUrl: './product-form.css'
})
export class ProductForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly productSvc = inject(ProductService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  productId = signal<string | null>(null);
  loading = signal(false);
  saving = signal(false);
  isEditMode = signal(false);

  form = this.fb.group({
    code: [''],
    name: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
    price: [0, [Validators.required, Validators.min(0)]],
    statusId: ['active', Validators.required]
  });

  statusOptions = [
    { value: 'active', label: 'Ativo' },
    { value: 'inactive', label: 'Inativo' }
  ];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) { this.productId.set(id); this.isEditMode.set(true); this.loadProduct(id); }
  }

  loadProduct(id: string): void {
    this.loading.set(true);
    this.productSvc.getById(id).subscribe({
      next: (p) => { this.form.patchValue({ code: p.code, name: p.name, description: p.description, price: p.price, statusId: p.statusId }); this.loading.set(false); },
      error: () => { this.loading.set(false); this.snackBar.open('Erro ao carregar produto', 'Fechar', { duration: 3000 }); this.router.navigate(['/produtos']); }
    });
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
