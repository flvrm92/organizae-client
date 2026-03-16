import { Component, OnInit, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { SupplierService } from '../../services/supplier.service';
import { PageHeader } from '../../../../components/page-header/page-header';
import { AddressForm } from '../../../../components/address-form/address-form';
import { IAddress } from '../../../../../types/IAddress';

@Component({
  selector: 'app-supplier-form',
  imports: [ReactiveFormsModule, RouterLink, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatDividerModule, PageHeader, AddressForm],
  templateUrl: './supplier-form.html',
  styleUrl: './supplier-form.css'
})
export class SupplierForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly supplierSvc = inject(SupplierService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  supplierId = signal<string | null>(null);
  loading = signal(false);
  saving = signal(false);
  isEditMode = signal(false);
  loadedAddresses = signal<IAddress[]>([]);

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.email]],
    phone: [''],
    document: [''],
    addresses: this.fb.array([])
  });

  get addressesArray(): FormArray { return this.form.get('addresses') as FormArray; }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) { this.supplierId.set(id); this.isEditMode.set(true); this.loadSupplier(id); }
  }

  loadSupplier(id: string): void {
    this.loading.set(true);
    this.supplierSvc.getById(id).subscribe({
      next: (s) => {
        this.form.patchValue({
          name: s.name,
          email: s.email,
          phone: s.phone,
          document: s.document
        });
        this.loadedAddresses.set(s.addresses ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Erro ao carregar fornecedor', 'Fechar', { duration: 3000 });
        this.router.navigate(['/fornecedores']);
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const { name, email, phone, document, addresses } = this.form.value;
    const payload = { name: name!, email: email ?? null, phone: phone ?? null, document: document ?? null, addresses: addresses as any[] };
    const obs = this.isEditMode() ? this.supplierSvc.update(this.supplierId()!, payload) : this.supplierSvc.create(payload);
    obs.subscribe({
      next: () => { this.saving.set(false); this.snackBar.open(this.isEditMode() ? 'Fornecedor atualizado!' : 'Fornecedor criado!', 'Fechar', { duration: 3000 }); this.router.navigate(['/fornecedores']); },
      error: (err) => { this.saving.set(false); const msg = err?.error?.detail ?? 'Erro ao salvar fornecedor'; this.snackBar.open(msg, 'Fechar', { duration: 5000 }); }
    });
  }
}
