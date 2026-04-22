import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { CustomerList } from './customer-list';
import { CustomerService } from '../../services/customer.service';
import { ICustomer } from '../../../../../types/ICustomer';

const makeCustomer = (partial: Partial<ICustomer>): ICustomer => ({
  id: 'id-1',
  organizationId: 'org-1',
  firstName: null,
  lastName: null,
  email: null,
  document: null,
  phone: null,
  cellPhone: null,
  addresses: null,
  ...partial,
});

const TEST_CUSTOMERS: ICustomer[] = [
  makeCustomer({ id: '1', firstName: 'João', lastName: 'Silva' }),
  makeCustomer({ id: '2', firstName: 'Maria', lastName: 'Conceição', email: 'maria@example.com' }),
  makeCustomer({ id: '3', firstName: 'Carlos', lastName: 'Nóbrega', document: '123.456.789-00' }),
  makeCustomer({ id: '4', firstName: 'Alice', lastName: 'Fonseca', email: 'alice@café.com' }),
];

describe('CustomerList – accent-insensitive filtering', () => {
  let component: CustomerList;
  let fixture: ComponentFixture<CustomerList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerList],
      providers: [
        provideRouter([]),
        {
          provide: CustomerService,
          useValue: {
            getAll: () => of(TEST_CUSTOMERS),
            delete: () => of(void 0),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomerList);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads all customers initially', () => {
    expect(component.filteredCustomers().length).toBe(4);
  });

  describe('name search', () => {
    it('finds João by accent-free query "joao"', () => {
      component.searchTerm = 'joao';
      component.applyFilter();
      const names = component.filteredCustomers().map(c => c.firstName);
      expect(names).toContain('João');
      expect(component.filteredCustomers().length).toBe(1);
    });

    it('finds João by accented query "joão"', () => {
      component.searchTerm = 'joão';
      component.applyFilter();
      expect(component.filteredCustomers().length).toBe(1);
      expect(component.filteredCustomers()[0].firstName).toBe('João');
    });

    it('finds Conceição by accent-free query "conceicao"', () => {
      component.searchTerm = 'conceicao';
      component.applyFilter();
      expect(component.filteredCustomers().length).toBe(1);
      expect(component.filteredCustomers()[0].lastName).toBe('Conceição');
    });

    it('finds Nóbrega by accent-free query "nobrega"', () => {
      component.searchTerm = 'nobrega';
      component.applyFilter();
      expect(component.filteredCustomers().length).toBe(1);
      expect(component.filteredCustomers()[0].lastName).toBe('Nóbrega');
    });

    it('finds by partial first name (case-insensitive)', () => {
      component.searchTerm = 'CARLOS';
      component.applyFilter();
      expect(component.filteredCustomers().length).toBe(1);
    });
  });

  describe('email search', () => {
    it('finds customer by email', () => {
      component.searchTerm = 'maria@example';
      component.applyFilter();
      expect(component.filteredCustomers().length).toBe(1);
      expect(component.filteredCustomers()[0].email).toBe('maria@example.com');
    });

    it('finds customer by accented email accent-free', () => {
      component.searchTerm = 'cafe.com';
      component.applyFilter();
      expect(component.filteredCustomers().length).toBe(1);
      expect(component.filteredCustomers()[0].email).toBe('alice@café.com');
    });
  });

  describe('document search', () => {
    it('finds customer by document', () => {
      component.searchTerm = '123.456';
      component.applyFilter();
      expect(component.filteredCustomers().length).toBe(1);
      expect(component.filteredCustomers()[0].document).toBe('123.456.789-00');
    });
  });

  describe('empty / blank query', () => {
    it('returns all customers when query is empty string', () => {
      component.searchTerm = '';
      component.applyFilter();
      expect(component.filteredCustomers().length).toBe(4);
    });

    it('returns all customers when query is only whitespace', () => {
      component.searchTerm = '   ';
      component.applyFilter();
      expect(component.filteredCustomers().length).toBe(4);
    });
  });

  describe('no-match', () => {
    it('returns empty list when no customer matches', () => {
      component.searchTerm = 'zzznomatch';
      component.applyFilter();
      expect(component.filteredCustomers().length).toBe(0);
    });
  });
});
