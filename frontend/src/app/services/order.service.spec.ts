import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { OrderService } from './order.service';

describe('OrderService', () => {
  let service: OrderService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(OrderService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('invia solo i filtri valorizzati', () => {
    service.list({ status: 'paid', from: '2026-09-01', to: '' }).subscribe();

    const req = http.expectOne((r) => r.url === 'http://localhost:3000/orders');
    expect(req.request.params.keys().sort()).toEqual(['from', 'status']);
    req.flush({ orders: [] });
  });

  it('crea l’ordine annidando i dati cliente sotto "order"', () => {
    const customer = { full_name: 'A', email: 'a@b.it', address: 'x', city: 'y', postal_code: '00100' };
    service.create(customer).subscribe();

    const req = http.expectOne('http://localhost:3000/orders');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ order: customer });
    req.flush({ order: { id: 1 } });
  });

  it('createFailing fa POST su /orders/fail con i dati cliente annidati', () => {
    const customer = { full_name: 'A', email: 'a@b.it', address: 'x', city: 'y', postal_code: '00100' };
    service.createFailing(customer).subscribe({ error: () => {} });

    const req = http.expectOne('http://localhost:3000/orders/fail');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ order: customer });
    req.flush({ error: 'errore - ordine non andato a buon fine' }, { status: 422, statusText: 'Unprocessable' });
  });
});
