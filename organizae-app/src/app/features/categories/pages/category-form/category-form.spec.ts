import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { firstValueFrom } from 'rxjs';

import { CategoryForm } from './category-form';
import { CategoryService } from '../../services/category.service';
import { ICategory } from '../../../../../types/ICategory';

const ROOT_CATEGORIES: ICategory[] = [
  { id: 'cat-1', name: 'Frutas', organizationId: 'org-1', parentCategoryId: null, parentCategoryName: null },
  { id: 'cat-2', name: 'Legumes', organizationId: 'org-1', parentCategoryId: null, parentCategoryName: null },
  { id: 'cat-3', name: 'Açúcar', organizationId: 'org-1', parentCategoryId: null, parentCategoryName: null },
  { id: 'cat-4', name: 'Bebidas', organizationId: 'org-1', parentCategoryId: null, parentCategoryName: null },
  { id: 'cat-5', name: 'Pão', organizationId: 'org-1', parentCategoryId: null, parentCategoryName: null },
];

describe('CategoryForm – filterCategories', () => {
  let component: CategoryForm;
  let fixture: ComponentFixture<CategoryForm>;

  const categoryServiceStub = {
    getAll: () => of(ROOT_CATEGORIES),
    getById: () => of({ id: 'cat-1', name: 'Frutas', organizationId: 'org-1', parentCategoryId: null, parentCategoryName: null } as ICategory),
    create: () => of({}),
    update: () => of({}),
    refresh: () => { },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoryForm],
      providers: [
        provideRouter([]),
        { provide: CategoryService, useValue: categoryServiceStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CategoryForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  describe('accent-insensitive filtering', () => {
    it('matches "acucar" (no accent) against "Açúcar"', () => {
      const result = component.filterCategories('acucar');
      expect(result.map(c => c.name)).toContain('Açúcar');
    });

    it('matches "açúcar" (with accent) against "Açúcar"', () => {
      const result = component.filterCategories('açúcar');
      expect(result.map(c => c.name)).toContain('Açúcar');
    });

    it('matches "pao" (no accent) against "Pão"', () => {
      const result = component.filterCategories('pao');
      expect(result.map(c => c.name)).toContain('Pão');
    });

    it('matches "fru" as a prefix of "Frutas"', () => {
      const result = component.filterCategories('fru');
      expect(result.map(c => c.name)).toContain('Frutas');
    });

    it('is case-insensitive', () => {
      const result = component.filterCategories('LEGUMES');
      expect(result.map(c => c.name)).toContain('Legumes');
    });

    it('returns empty array when no category matches', () => {
      const result = component.filterCategories('xyz');
      expect(result).toHaveLength(0);
    });

    it('returns all root categories for an empty query', () => {
      const result = component.filterCategories('');
      expect(result).toHaveLength(ROOT_CATEGORIES.length);
    });
  });

  describe('self-exclusion behavior', () => {
    it('excludes the current category from the filtered results', () => {
      component.categoryId.set('cat-1');
      const result = component.filterCategories('');
      const ids = result.map(c => c.id);
      expect(ids).not.toContain('cat-1');
    });

    it('still excludes current category when filtering by name', () => {
      component.categoryId.set('cat-1');
      const result = component.filterCategories('Frutas');
      expect(result).toHaveLength(0);
    });

    it('does not exclude other categories when a categoryId is set', () => {
      component.categoryId.set('cat-1');
      const result = component.filterCategories('');
      expect(result.map(c => c.id)).toContain('cat-2');
    });

    it('includes all categories when categoryId is null (create mode)', () => {
      component.categoryId.set(null);
      const result = component.filterCategories('Frutas');
      expect(result.map(c => c.id)).toContain('cat-1');
    });
  });

  describe('filteredCategories$ observable', () => {
    it('emits accent-insensitive results when parentCategoryControl changes', async () => {
      component.parentCategoryControl.setValue('acucar');
      const results = await firstValueFrom(component.filteredCategories$);
      expect(results.map(c => c.name)).toContain('Açúcar');
    });
  });
});
