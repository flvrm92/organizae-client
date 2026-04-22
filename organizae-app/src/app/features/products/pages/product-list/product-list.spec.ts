import { ComponentFixture, TestBed } from '@angular/core/testing';
import { registerLocaleData } from '@angular/common';
import localePtBr from '@angular/common/locales/pt';
import { LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';

registerLocaleData(localePtBr, 'pt-BR');

import { ProductList } from './product-list';
import { ProductService } from '../../services/product.service';
import { IProduct } from '../../../../../types/IProduct';
import { IProductFilterMetadata } from '../../../../../types/IProductFilterMetadata';
import { IProductListFilters } from '../../../../../types/IProductListFilters';

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
  makeProduct({ id: '1', code: 101, name: 'Café Especial', categoryId: 'cat-1', categoryName: 'Bebidas', size: 'M', color: 'Azul', tags: ['quente'] }),
  makeProduct({ id: '2', code: 202, name: 'Pão de Açúcar', categoryId: 'cat-2', categoryName: 'Padaria', tags: ['doce'] }),
  makeProduct({ id: '3', code: 303, name: 'Suco de Limão', categoryId: 'cat-1', categoryName: 'Bebidas', size: 'G', tags: ['frio'] }),
  makeProduct({ id: '4', code: 404, name: 'Sonho', categoryId: 'cat-2', categoryName: 'Confeitaria', tags: ['doce'] }),
  makeProduct({ id: '5', code: 505, name: 'Bolo de Cenoura', tags: [] }),
];

const TEST_METADATA: IProductFilterMetadata = {
  categories: [
    { id: 'cat-1', name: 'Bebidas', subcategories: [{ id: 'sub-1', name: 'Alcoólicas' }] },
    { id: 'cat-2', name: 'Padaria', subcategories: [] },
  ],
  statuses: [{ id: 'st-1', name: 'Ativo' }],
  sizes: ['P', 'M', 'G'],
  colors: ['Azul', 'Vermelho'],
  tags: ['quente', 'frio', 'doce'],
};

describe('ProductList – API-backed faceted filtering', () => {
  let component: ProductList;
  let fixture: ComponentFixture<ProductList>;
  let getFilteredSpy: ReturnType<typeof vi.fn>;
  let getFilterMetadataSpy: ReturnType<typeof vi.fn>;
  let deleteSpy: ReturnType<typeof vi.fn>;
  let dialogOpenSpy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    getFilteredSpy = vi.fn().mockReturnValue(of([...TEST_PRODUCTS]));
    getFilterMetadataSpy = vi.fn().mockReturnValue(of(TEST_METADATA));
    deleteSpy = vi.fn().mockReturnValue(of(void 0));
    dialogOpenSpy = vi.fn().mockReturnValue({ afterClosed: () => of(true) });

    await TestBed.configureTestingModule({
      imports: [ProductList, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: LOCALE_ID, useValue: 'pt-BR' },
        {
          provide: ProductService,
          useValue: {
            getFiltered: getFilteredSpy,
            getFilterMetadata: getFilterMetadataSpy,
            delete: deleteSpy,
          },
        },
        { provide: MatDialog, useValue: { open: dialogOpenSpy } },
        { provide: MatSnackBar, useValue: { open: vi.fn() } },
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

  describe('initialization', () => {
    it('calls getFilterMetadata once on init', () => {
      expect(getFilterMetadataSpy).toHaveBeenCalledTimes(1);
    });

    it('calls getFiltered once on init after metadata loads', () => {
      expect(getFilteredSpy).toHaveBeenCalledTimes(1);
    });

    it('populates products signal after load', () => {
      expect(component.products().length).toBe(5);
    });

    it('populates metadata signal', () => {
      expect(component.metadata()).toEqual(TEST_METADATA);
    });

    it('initial getFiltered call uses empty filters', () => {
      const args = getFilteredSpy.mock.calls[0][0] as IProductListFilters;
      expect(args.q).toBeUndefined();
      expect(args.categoryId).toBeUndefined();
      expect(args.sizes).toEqual([]);
    });
  });

  describe('category change', () => {
    it('clears subcategory selection when category changes', () => {
      component.selectedSubcategoryId = 'sub-1';
      component.selectedCategoryId = 'cat-1';
      component.onCategoryChange();
      expect(component.selectedSubcategoryId).toBe('');
    });

    it('reloads products when category changes', () => {
      const before = getFilteredSpy.mock.calls.length;
      component.selectedCategoryId = 'cat-1';
      component.onCategoryChange();
      expect(getFilteredSpy.mock.calls.length).toBe(before + 1);
    });

    it('passes selected categoryId to getFiltered', () => {
      component.selectedCategoryId = 'cat-1';
      component.onCategoryChange();
      const lastArgs = getFilteredSpy.mock.calls[getFilteredSpy.mock.calls.length - 1][0] as IProductListFilters;
      expect(lastArgs.categoryId).toBe('cat-1');
    });

    it('does not pass subcategoryId after category change clears it', () => {
      component.selectedSubcategoryId = 'sub-1';
      component.selectedCategoryId = 'cat-1';
      component.onCategoryChange();
      const lastArgs = getFilteredSpy.mock.calls[getFilteredSpy.mock.calls.length - 1][0] as IProductListFilters;
      expect(lastArgs.subcategoryId).toBeUndefined();
    });
  });

  describe('subcategory availability', () => {
    it('availableSubcategories is empty when no category is selected', () => {
      component.selectedCategoryId = '';
      expect(component.availableSubcategories.length).toBe(0);
    });

    it('returns subcategories for the selected category', () => {
      component.selectedCategoryId = 'cat-1';
      expect(component.availableSubcategories.length).toBe(1);
      expect(component.availableSubcategories[0].id).toBe('sub-1');
    });

    it('returns empty subcategories for a category with none', () => {
      component.selectedCategoryId = 'cat-2';
      expect(component.availableSubcategories.length).toBe(0);
    });
  });

  describe('clear filters', () => {
    beforeEach(() => {
      component.searchTerm = 'café';
      component.selectedCategoryId = 'cat-1';
      component.selectedSubcategoryId = 'sub-1';
      component.selectedStatusId = 'st-1';
      component.selectedSizes = ['M'];
      component.selectedColors = ['Azul'];
      component.selectedTags = ['quente'];
      component.pageIndex = 2;
    });

    it('resets all filter properties', () => {
      component.clearFilters();
      expect(component.searchTerm).toBe('');
      expect(component.selectedCategoryId).toBe('');
      expect(component.selectedSubcategoryId).toBe('');
      expect(component.selectedStatusId).toBe('');
      expect(component.selectedSizes).toEqual([]);
      expect(component.selectedColors).toEqual([]);
      expect(component.selectedTags).toEqual([]);
    });

    it('resets page index to 0', () => {
      component.clearFilters();
      expect(component.pageIndex).toBe(0);
    });

    it('reloads products after clearing', () => {
      const before = getFilteredSpy.mock.calls.length;
      component.clearFilters();
      expect(getFilteredSpy.mock.calls.length).toBe(before + 1);
    });

    it('reload after clear sends empty filters', () => {
      component.clearFilters();
      const lastArgs = getFilteredSpy.mock.calls[getFilteredSpy.mock.calls.length - 1][0] as IProductListFilters;
      expect(lastArgs.q).toBeUndefined();
      expect(lastArgs.categoryId).toBeUndefined();
      expect(lastArgs.sizes).toEqual([]);
    });
  });

  describe('delete reloads with current filters', () => {
    it('calls delete with the product id', () => {
      component.deleteProduct(TEST_PRODUCTS[0]);
      expect(deleteSpy).toHaveBeenCalledWith(TEST_PRODUCTS[0].id);
    });

    it('reloads products after successful delete', () => {
      const before = getFilteredSpy.mock.calls.length;
      component.deleteProduct(TEST_PRODUCTS[0]);
      expect(getFilteredSpy.mock.calls.length).toBe(before + 1);
    });

    it('reloads using the current filter state, not a blank filter', () => {
      component.selectedCategoryId = 'cat-1';
      component.selectedSizes = ['M'];
      component.deleteProduct(TEST_PRODUCTS[0]);
      const lastArgs = getFilteredSpy.mock.calls[getFilteredSpy.mock.calls.length - 1][0] as IProductListFilters;
      expect(lastArgs.categoryId).toBe('cat-1');
      expect(lastArgs.sizes).toEqual(['M']);
    });
  });

  describe('pagination resets on filter change', () => {
    it('resets pageIndex to 0 when onFilterChange is called', () => {
      component.pageIndex = 3;
      component.onFilterChange();
      expect(component.pageIndex).toBe(0);
    });

    it('resets pageIndex to 0 when category changes', () => {
      component.pageIndex = 2;
      component.onCategoryChange();
      expect(component.pageIndex).toBe(0);
    });

    it('resets pageIndex to 0 when filters are cleared', () => {
      component.pageIndex = 4;
      component.clearFilters();
      expect(component.pageIndex).toBe(0);
    });
  });

  describe('paging', () => {
    it('pagedProducts reflects the first page', () => {
      expect(component.pagedProducts().length).toBeLessThanOrEqual(component.pageSize);
    });

    it('pagedProducts updates on page event', () => {
      const manyProducts = Array.from({ length: 25 }, (_, i) =>
        makeProduct({ id: String(i), code: i, name: `Product ${i}` })
      );
      getFilteredSpy.mockReturnValue(of(manyProducts));
      component.loadProducts();

      component.onPage({ pageIndex: 1, pageSize: 20, length: 25 } as any);
      expect(component.pagedProducts().length).toBe(5);
    });
  });

  describe('active filter chips', () => {
    it('hasActiveFilters is false when no filters are applied', () => {
      expect(component.hasActiveFilters).toBe(false);
    });

    it('hasActiveFilters is true when search term is set', () => {
      component.searchTerm = 'café';
      expect(component.hasActiveFilters).toBe(true);
    });

    it('hasActiveFilters is true when a category is selected', () => {
      component.selectedCategoryId = 'cat-1';
      expect(component.hasActiveFilters).toBe(true);
    });

    it('hasActiveFilters is true when a size is selected', () => {
      component.selectedSizes = ['M'];
      expect(component.hasActiveFilters).toBe(true);
    });

    it('activeFilterChips contains a chip for the search term', () => {
      component.searchTerm = 'café';
      const chip = component.activeFilterChips.find(c => c.key === 'search');
      expect(chip).toBeTruthy();
      expect(chip?.label).toContain('café');
    });

    it('activeFilterChips resolves category name from metadata', () => {
      component.selectedCategoryId = 'cat-1';
      const chip = component.activeFilterChips.find(c => c.key === 'category');
      expect(chip?.label).toContain('Bebidas');
    });

    it('activeFilterChips contains per-value chips for multi-select sizes', () => {
      component.selectedSizes = ['M', 'G'];
      const chips = component.activeFilterChips;
      expect(chips.some(c => c.key === 'size:M')).toBe(true);
      expect(chips.some(c => c.key === 'size:G')).toBe(true);
    });

    it('activeFilterChips contains per-value chips for tags', () => {
      component.selectedTags = ['quente', 'frio'];
      const chips = component.activeFilterChips;
      expect(chips.some(c => c.key === 'tag:quente')).toBe(true);
      expect(chips.some(c => c.key === 'tag:frio')).toBe(true);
    });

    it('clear-all button is absent from DOM when no filters are active', () => {
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector('.clear-all-btn');
      expect(btn).toBeNull();
    });

    it('clear-all button is present in DOM when a filter is active', () => {
      component.selectedCategoryId = 'cat-1';
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector('.clear-all-btn');
      expect(btn).not.toBeNull();
    });
  });

  describe('removeFilterChip', () => {
    it('clears search term and reloads', () => {
      component.searchTerm = 'café';
      const before = getFilteredSpy.mock.calls.length;
      component.removeFilterChip('search');
      expect(component.searchTerm).toBe('');
      expect(getFilteredSpy.mock.calls.length).toBe(before + 1);
    });

    it('clears category and also subcategory and reloads', () => {
      component.selectedCategoryId = 'cat-1';
      component.selectedSubcategoryId = 'sub-1';
      const before = getFilteredSpy.mock.calls.length;
      component.removeFilterChip('category');
      expect(component.selectedCategoryId).toBe('');
      expect(component.selectedSubcategoryId).toBe('');
      expect(getFilteredSpy.mock.calls.length).toBe(before + 1);
    });

    it('clears status and reloads', () => {
      component.selectedStatusId = 'st-1';
      const before = getFilteredSpy.mock.calls.length;
      component.removeFilterChip('status');
      expect(component.selectedStatusId).toBe('');
      expect(getFilteredSpy.mock.calls.length).toBe(before + 1);
    });

    it('removes only the targeted size, keeping others', () => {
      component.selectedSizes = ['M', 'G'];
      component.removeFilterChip('size:M');
      expect(component.selectedSizes).toEqual(['G']);
    });

    it('removes only the targeted color, keeping others', () => {
      component.selectedColors = ['Azul', 'Vermelho'];
      component.removeFilterChip('color:Azul');
      expect(component.selectedColors).toEqual(['Vermelho']);
    });

    it('removes only the targeted tag, keeping others', () => {
      component.selectedTags = ['quente', 'frio'];
      component.removeFilterChip('tag:quente');
      expect(component.selectedTags).toEqual(['frio']);
    });

    it('resets pageIndex to 0 when removing any chip', () => {
      component.pageIndex = 3;
      component.selectedStatusId = 'st-1';
      component.removeFilterChip('status');
      expect(component.pageIndex).toBe(0);
    });
  });

  describe('debounced search', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('does not call getFiltered immediately on onSearchInput', () => {
      const before = getFilteredSpy.mock.calls.length;
      component.searchTerm = 'ca';
      component.onSearchInput();
      expect(getFilteredSpy.mock.calls.length).toBe(before);
      vi.advanceTimersByTime(400);
    });

    it('calls getFiltered exactly once after debounce even with rapid typing', () => {
      const before = getFilteredSpy.mock.calls.length;
      component.searchTerm = 'ca';
      component.onSearchInput();
      component.searchTerm = 'caf';
      component.onSearchInput();
      component.searchTerm = 'café';
      component.onSearchInput();
      vi.advanceTimersByTime(400);
      expect(getFilteredSpy.mock.calls.length).toBe(before + 1);
    });

    it('passes the latest search term after debounce fires', () => {
      component.searchTerm = 'café';
      component.onSearchInput();
      vi.advanceTimersByTime(400);
      const lastArgs = getFilteredSpy.mock.calls[getFilteredSpy.mock.calls.length - 1][0] as IProductListFilters;
      expect(lastArgs.q).toBe('café');
    });

    it('resets pageIndex to 0 after debounce fires', () => {
      component.pageIndex = 2;
      component.searchTerm = 'café';
      component.onSearchInput();
      vi.advanceTimersByTime(400);
      expect(component.pageIndex).toBe(0);
    });
  });

  describe('empty state variants', () => {
    it('hasActiveFilters is false and products empty after clearFilters with empty result', async () => {
      getFilteredSpy.mockReturnValue(of([]));
      component.clearFilters();
      await fixture.whenStable();
      expect(component.hasActiveFilters).toBe(false);
      expect(component.products().length).toBe(0);
    });

    it('hasActiveFilters is true and products empty when filter active returns no results', async () => {
      getFilteredSpy.mockReturnValue(of([]));
      component.selectedCategoryId = 'cat-1';
      component.onFilterChange();
      await fixture.whenStable();
      expect(component.hasActiveFilters).toBe(true);
      expect(component.products().length).toBe(0);
    });

    it('DOM shows no-match message when filters active and no results', async () => {
      getFilteredSpy.mockReturnValue(of([]));
      component.selectedCategoryId = 'cat-1';
      component.onFilterChange();
      await fixture.whenStable();
      fixture.detectChanges();
      const text = fixture.nativeElement.textContent as string;
      expect(text).toContain('Nenhum produto encontrado para os filtros');
    });

    it('DOM shows create CTA when catalog is empty and no filters active', async () => {
      getFilteredSpy.mockReturnValue(of([]));
      component.clearFilters();
      await fixture.whenStable();
      fixture.detectChanges();
      const text = fixture.nativeElement.textContent as string;
      expect(text).toContain('Criar primeiro produto');
    });
  });
});
