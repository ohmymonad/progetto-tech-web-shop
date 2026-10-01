import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { ProductService } from './product.service';

describe('ProductService', () => {
  let service: ProductService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ProductService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('passa filtri e paginazione come query string, omettendo quelli vuoti', () => {
    service.list({ q: 'mouse', category: '', page: 2, per_page: 5 }).subscribe();

    const req = http.expectOne((r) => r.url === 'http://localhost:3000/products');
    expect(req.request.params.keys().sort()).toEqual(['page', 'per_page', 'q']);
    expect(req.request.params.get('page')).toBe('2');
    req.flush({ products: [], meta: { page: 2, per_page: 5, total: 0, total_pages: 0 } });
  });

  it('estrae il prodotto dal dettaglio', () => {
    let name = '';
    service.get(3).subscribe((p) => (name = p.name));

    http.expectOne('http://localhost:3000/products/3').flush({ product: { id: 3, name: 'Tastiera' } });
    expect(name).toBe('Tastiera');
  });
});
