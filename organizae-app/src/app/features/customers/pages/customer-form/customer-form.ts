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
import { CustomerService } from '../../services/customer.service';
import { PageHeader } from '../../../../components/page-header/page-header';
import { AddressForm } from '../../../../components/address-form/address-form';
import { IAddress } from '../../../../../types/IAddress';

@Component({
  selector: 'app-customer-form',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    PageHeader,
    AddressForm
  ],
  templateUrl: './customer-form.html',
  styleUrl: './customer-form.css'
})
export class CustomerForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly customerSvc = inject(CustomerService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  customerId = signal<string | null>(null);
  loading = signal(false);
  saving = signal(false);
  isEditMode = signal(false);
  loadedAddresses = signal<IAddress[]>([]);

  form = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: [''],
    email: ['', [Validators.email]],
    phone: [''],
    cellPhone: [''],
    document: [''],
    addresses: this.fb.array([])
  });

  get addressesArray(): FormArray {
    return this.form.get('addresses') as FormArray;
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.customerId.set(id);
      this.isEditMode.set(true);
      this.loadCustomer(id);
    }
  }

  loadCustomer(id: string): void {
    this.loading.set(true);
    this.customerSvc.getById(id).subscribe({
      next: (customer) => {
        this.form.patchValue({
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email,
          phone: customer.phone,
          cellPhone: customer.cellPhone,
          document: customer.document,
        });

        this.loadedAddresses.set(customer.addresses ?? []);

        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Erro ao carregar cliente', 'Fechar', { duration: 3000 });
        this.router.navigate(['/clientes']);
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const { firstName, lastName, email, phone, cellPhone, document, addresses } = this.form.value;
    const payload = {
      firstName: firstName!,
      lastName: lastName ?? null,
      email: email ?? null,
      phone: phone ?? null,
      cellPhone: cellPhone ?? null,
      document: document ?? null,
      addresses: addresses as IAddress[]
    };

    const obs = this.isEditMode()
      ? this.customerSvc.update(this.customerId()!, payload)
      : this.customerSvc.create(payload);

    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.snackBar.open(this.isEditMode() ? 'Cliente atualizado!' : 'Cliente criado!', 'Fechar', { duration: 3000 });
        this.router.navigate(['/clientes']);
      },
      error: (err) => {
        this.saving.set(false);
        const msg = err?.error?.detail ?? err?.error?.title ?? 'Erro ao salvar cliente';
        this.snackBar.open(msg, 'Fechar', { duration: 5000 });
      }
    });
  }
}
