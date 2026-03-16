import { Component, input, OnInit, inject } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { IAddress } from '../../../types/IAddress';

@Component({
  selector: 'app-address-form',
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule, MatCheckboxModule],
  templateUrl: './address-form.html',
  styleUrl: './address-form.css'
})
export class AddressForm implements OnInit {
  private readonly fb = inject(FormBuilder);

  parentArray = input.required<FormArray>();
  addresses = input<IAddress[]>([]);

  ngOnInit(): void {
    const arr = this.parentArray();
    const existingAddresses = this.addresses();
    if (existingAddresses && existingAddresses.length > 0) {
      existingAddresses.forEach(addr => arr.push(this.createAddressGroup(addr)));
    }
  }

  createAddressGroup(addr?: Partial<IAddress>) {
    return this.fb.group({
      id: [addr?.id ?? null],
      street: [addr?.street ?? '', Validators.required],
      number: [addr?.number ?? ''],
      complement: [addr?.complement ?? ''],
      neighborhood: [addr?.neighborhood ?? ''],
      city: [addr?.city ?? '', Validators.required],
      zipCode: [addr?.zipCode ?? ''],
      isPrimary: [addr?.isPrimary ?? false]
    });
  }

  addAddress(): void {
    this.parentArray().push(this.createAddressGroup());
  }

  removeAddress(index: number): void {
    this.parentArray().removeAt(index);
  }

  get addressGroups() {
    return this.parentArray().controls;
  }
}
