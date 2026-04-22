import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { ProductService } from './product.service';
import { ENVIRONMENT } from '../../../config/environment.token';
import { IProductListFilters } from '../../../../types/IProductListFilters';

const TEST_API = 'http://test-api';

const emptyFilters = (): IProductListFilters => ({
  sizes: [],
  colors: [],
  tags: [],
});

describe('ProductService – getFiltered', () => {
  let service: ProductService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ENVIRONMENT, useValue: { apiUrl: TEST_API } },
      ],
    });
    service = TestBed.inject(ProductService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('sends repeated params for sizes, colors, and tags', () => {
    service.getFiltered({ sizes: ['P', 'M', 'G'], colors: ['Vermelho', 'Azul'], tags: ['sale'], q: undefined }).subscribe();

    const req = httpMock.expectOne(r => r.url === `${TEST_API}/api/Product/filtered`);
    expect(req.request.params.getAll('sizes')).toEqual(['P', 'M', 'G']);
    expect(req.request.params.getAll('colors')).toEqual(['Vermelho', 'Azul']);
    expect(req.request.params.getAll('tags')).toEqual(['sale']);
    req.flush([]);
  });

  it('does not send params for empty arrays', () => {
    service.getFiltered(emptyFilters()).subscribe();

    const req = httpMock.expectOne(`${TEST_API}/api/Product/filtered`);
    expect(req.request.params.has('sizes')).toBe(false);
    expect(req.request.params.has('colors')).toBe(false);
    expect(req.request.params.has('tags')).toBe(false);
    req.flush([]);
  });

  it('does not send scalar params when undefined', () => {
    service.getFiltered(emptyFilters()).subscribe();

    const req = httpMock.expectOne(`${TEST_API}/api/Product/filtered`);
    expect(req.request.params.has('q')).toBe(false);
    expect(req.request.params.has('categoryId')).toBe(false);
    expect(req.request.params.has('subcategoryId')).toBe(false);
    expect(req.request.params.has('statusId')).toBe(false);
    req.flush([]);
  });

  it('sends q, categoryId, subcategoryId, and statusId when provided', () => {
    service.getFiltered({
      ...emptyFilters(),
      q: 'café',
      categoryId: 'cat-1',
      subcategoryId: 'sub-1',
      statusId: 'status-1',
    }).subscribe();

    const req = httpMock.expectOne(r => r.url === `${TEST_API}/api/Product/filtered`);
    expect(req.request.params.get('q')).toBe('café');
    expect(req.request.params.get('categoryId')).toBe('cat-1');
    expect(req.request.params.get('subcategoryId')).toBe('sub-1');
    expect(req.request.params.get('statusId')).toBe('status-1');
    req.flush([]);
  });

  it('sends a mix of scalar and multiselect params together', () => {
    service.getFiltered({
      q: 'bolo',
      categoryId: 'cat-2',
      subcategoryId: undefined,
      statusId: undefined,
      sizes: ['U'],
      colors: [],
      tags: ['novo', 'destaque'],
    }).subscribe();

    const req = httpMock.expectOne(r => r.url === `${TEST_API}/api/Product/filtered`);
    expect(req.request.params.get('q')).toBe('bolo');
    expect(req.request.params.get('categoryId')).toBe('cat-2');
    expect(req.request.params.has('subcategoryId')).toBe(false);
    expect(req.request.params.getAll('sizes')).toEqual(['U']);
    expect(req.request.params.has('colors')).toBe(false);
    expect(req.request.params.getAll('tags')).toEqual(['novo', 'destaque']);
    req.flush([]);
  });
});

describe('ProductService – getFilterMetadata', () => {
  let service: ProductService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ENVIRONMENT, useValue: { apiUrl: TEST_API } },
      ],
    });
    service = TestBed.inject(ProductService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('calls GET /api/Product/filters', () => {
    service.getFilterMetadata().subscribe();

    const req = httpMock.expectOne(`${TEST_API}/api/Product/filters`);
    expect(req.request.method).toBe('GET');
    req.flush({ categories: [], statuses: [], sizes: [], colors: [], tags: [] });
  });

  it('returns the metadata payload emitted by the API', () => {
    const mockMeta = {
      categories: [{ id: 'cat-1', name: 'Bebidas', subcategories: [] }],
      statuses: [{ id: 'status-1', name: 'Ativo' }],
      sizes: ['P', 'M'],
      colors: ['Vermelho'],
      tags: ['promoção'],
    };

    let result: any;
    service.getFilterMetadata().subscribe(m => (result = m));

    httpMock.expectOne(`${TEST_API}/api/Product/filters`).flush(mockMeta);
    expect(result).toEqual(mockMeta);
  });
});
