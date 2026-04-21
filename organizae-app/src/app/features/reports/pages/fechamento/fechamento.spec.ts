import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { Fechamento } from './fechamento';
import { ReportService } from '../../services/report.service';
import { CustomerService } from '../../../customers/services/customer.service';
import { ProductService } from '../../../products/services/product.service';
import { CategoryService } from '../../../categories/services/category.service';
import { StatusService } from '../../../../core/services/status.service';

describe('Fechamento', () => {
  let component: Fechamento;
  let fixture: ComponentFixture<Fechamento>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Fechamento],
      providers: [
        provideRouter([]),
        { provide: ReportService, useValue: { getFechamento: () => of({ summary: null, rows: [] }) } },
        { provide: CustomerService, useValue: { search: () => of([]) } },
        { provide: ProductService, useValue: { search: () => of([]) } },
        { provide: CategoryService, useValue: { getAll: () => of([]) } },
        { provide: StatusService, useValue: { getAll: () => of([]) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Fechamento);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('canGenerate is false before dates are set', () => {
    expect(component.canGenerate).toBe(false);
  });

  it('hasFetched starts as false', () => {
    expect(component.hasFetched()).toBe(false);
  });

  it('loading starts as false', () => {
    expect(component.loading()).toBe(false);
  });

  it('report starts as null', () => {
    expect(component.report()).toBeNull();
  });
});
