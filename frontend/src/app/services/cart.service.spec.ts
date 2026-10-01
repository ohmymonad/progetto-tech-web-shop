import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { AuthService } from '../core/auth.service';
import { Cart } from '../core/models';
import { CartService } from './cart.service';

const API = 'http://localhost:3000';
const cart = (quantity: number): Cart => ({
  id: 1,
  total: String(10 * quantity),
  items: [{ id: 7, product_id: 3, name: 'Mouse', quantity, unit_price: '10.0', subtotal: String(10 * quantity) }],
});

describe('CartService', () => {
  let service: CartService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(CartService);
    http = TestBed.inject(HttpTestingController);

    TestBed.inject(AuthService).login('u@x.it', 'p').subscribe();
    http.expectOne(`${API}/auth/login`).flush(
      { user: { id: 1, email: 'u@x.it', role: 'user', created_at: '' } },
      { headers: { Authorization: 'Bearer t' } },
    );
    TestBed.tick();
  });

  afterEach(() => http.verify());

  it('al login carica il carrello dal backend', () => {
    http.expectOne(`${API}/cart`).flush({ cart: cart(2) });
    expect(service.itemCount()).toBe(2);
  });

  it('dopo una mutazione adotta il carrello restituito', () => {
    http.expectOne(`${API}/cart`).flush({ cart: cart(1) });

    service.add(3).subscribe();
    const req = http.expectOne(`${API}/cart/items`);
    expect(req.request.body).toEqual({ product_id: 3, quantity: 1 });
    req.flush({ cart: cart(2) });

    expect(service.cart()?.items[0].quantity).toBe(2);
  });

  it('se una mutazione fallisce si riallinea rileggendo /cart', () => {
    http.expectOne(`${API}/cart`).flush({ cart: cart(1) });

    service.update(7, 0).subscribe({ error: () => {} });
    http.expectOne(`${API}/cart/items/7`).flush({ error: 'x' }, { status: 422, statusText: 'Unprocessable' });

    http.expectOne(`${API}/cart`).flush({ cart: cart(1) });
    expect(service.itemCount()).toBe(1);
  });

  it('al logout svuota lo stato locale', () => {
    http.expectOne(`${API}/cart`).flush({ cart: cart(1) });

    TestBed.inject(AuthService).clearSession();
    TestBed.tick();

    expect(service.cart()).toBeNull();
  });
});
