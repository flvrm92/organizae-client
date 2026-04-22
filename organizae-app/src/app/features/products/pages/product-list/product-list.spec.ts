import { ComponentFixture, TestBed } from '@angular/core/testing';
import { registerLocaleData } from '@angular/common';
import localePtBr from '@angular/common/locales/pt';
import { LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

registerLocaleData(localePtBr, 'pt-BR');

import { ProductList } from './product-list';
import { ProductService } from '../../services/product.service';
import { IProduct } from '../../../../../types/IProduct';

const makeProduct = (partial: Partial<IProduct>): IProduct => ({
  id: 'id-1',
  code: 1,
  name: null,
  description: null,
  organizationId: 'org-1',
  statusId: 'status-1',
  statusName: 'Ativo',
  price: 10,
  costPrice: 5,
  gainPercentage: 50,
  unitOfMeasureId: null,
  unitOfMeasureName: null,
  unitOfMeasureAbbreviation: null,
  size: null,
  color: null,
  categoryId: null,
  categoryName: null,
  subCategoryId: null,
  subCategoryName: null,
  tags: [],
  ...partial,
});

const TEST_PRODUCTS: IProduct[] = [
  makeProduct({ id: '1', code: 101, name: 'Café Especial', categoryName: 'Bebidas', tags: ['quente'] }),
  makeProduct({ id: '2', code: 202, name: 'Pão de Açúcar', categoryName: 'Padaria', tags: ['doce', 'confeitaria'] }),
  makeProduct({ id: '3', code: 303, name: 'Suco de Limão', categoryName: 'Bebidas', tags: ['frio', 'natural'] }),
  makeProduct({ id: '4', code: 404, name: 'Sonho', categoryName: 'Confeitaria', tags: ['doce'] }),
  makeProduct({ id: '5', code: 505, name: 'Bolo de Cenoura', categoryName: null, tags: [] }),
];

describe('ProductList – accent-insensitive filtering', () => {
  let component: ProductList;
  let fixture: ComponentFixture<ProductList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductList],
      providers: [
        provideRouter([]),
        { provide: LOCALE_ID, useValue: 'pt-BR' },
        {
          provide: ProductService,
          useValue: {
            getAll: () => of(TEST_PRODUCTS),
            delete: () => of(void 0),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductList);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads all products initially', () => {
    expect(component.filteredProducts().length).toBe(5);
  });

  describe('name search (accent-insensitive)', () => {
    it('finds "Café Especial" by accent-free query "cafe"', () => {
      component.searchTerm = 'cafe';
      component.applyFilter();
      expect(component.filteredProducts().length).toBe(1);
      expect(component.filteredProducts()[0].name).toBe('Café Especial');
    });

    it('finds "Pão de Açúcar" by accent-free query "acucar"', () => {
      component.searchTerm = 'acucar';
      component.applyFilter();
      expect(component.filteredProducts().length).toBe(1);
      expect(component.filteredProducts()[0].name).toBe('Pão de Açúcar');
    });

    it('finds "Suco de Limão" by accented query "limão"', () => {
      component.searchTerm = 'limão';
      component.applyFilter();
      expect(component.filteredProducts().length).toBe(1);
      expect(component.filteredProducts()[0].name).toBe('Suco de Limão');
    });

    it('is case-insensitive', () => {
      component.searchTerm = 'SONHO';
      component.applyFilter();
      expect(component.filteredProducts().length).toBe(1);
    });
  });

  describe('code search', () => {
    it('finds product by numeric code', () => {
      component.searchTerm = '303';
      component.applyFilter();
      expect(component.filteredProducts().length).toBe(1);
      expect(component.filteredProducts()[0].code).toBe(303);
    });

    it('finds multiple products by partial code', () => {
      component.searchTerm = '0';
      component.applyFilter();
      // all codes contain '0'
      expect(component.filteredProducts().length).toBe(5);
    });
  });

  describe('category search (accent-insensitive)', () => {
    it('finds products in category "Bebidas"', () => {
      component.searchTerm = 'Bebidas';
      component.applyFilter();
      expect(component.filteredProducts().length).toBe(2);
    });

    it('finds category "Confeitaria" accent-free', () => {
      component.searchTerm = 'confeitaria';
      component.applyFilter();
      // "Confeitaria" category + tag "confeitaria" on Pão de Açúcar
      const results = component.filteredProducts();
      const names = results.map(p => p.name);
      expect(names).toContain('Sonho');
    });
  });

  describe('tag search (accent-insensitive)', () => {
    it('finds products tagged "doce"', () => {
      component.searchTerm = 'doce';
      component.applyFilter();
      const names = component.filteredProducts().map(p => p.name);
      expect(names).toContain('Pão de Açúcar');
      expect(names).toContain('Sonho');
    });

    it('finds products tagged "natural"', () => {
      component.searchTerm = 'natural';
      component.applyFilter();
      expect(component.filteredProducts().length).toBe(1);
      expect(component.filteredProducts()[0].name).toBe('Suco de Limão');
    });
  });

  describe('empty / blank query', () => {
    it('returns all products when query is empty string', () => {
      component.searchTerm = '';
      component.applyFilter();
      expect(component.filteredProducts().length).toBe(5);
    });

    it('returns all products when query is only whitespace', () => {
      component.searchTerm = '   ';
      component.applyFilter();
      expect(component.filteredProducts().length).toBe(5);
    });
  });

  describe('no-match', () => {
    it('returns empty list when no product matches', () => {
      component.searchTerm = 'zzznomatch';
      component.applyFilter();
      expect(component.filteredProducts().length).toBe(0);
    });

    it('does not error when product has null name and null categoryName and no tags', () => {
      component.searchTerm = 'cenoura';
      component.applyFilter();
      // Bolo de Cenoura has name set, should find it
      expect(component.filteredProducts().length).toBe(1);
    });
  });
});
