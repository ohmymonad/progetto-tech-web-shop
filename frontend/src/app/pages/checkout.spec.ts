import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { AuthService } from '../core/auth.service';
import { CheckoutPage } from './checkout';

const API = 'http://localhost:3000';
const cart = { id: 1, total: '20.0', items: [{ id: 7, product_id: 3, name: 'Mouse', quantity: 2, unit_price: '10.0', subtotal: '20.0' }] };
const emptyCart = { id: 1, total: '0.0', items: [] };

describe('CheckoutPage', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [CheckoutPage],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);

    TestBed.inject(AuthService).login('u@x.it', 'p').subscribe();
    http.expectOne(`${API}/auth/login`).flush(
      { user: { id: 1, email: 'u@x.it', role: 'user', created_at: '' } },
      { headers: { Authorization: 'Bearer t' } },
    );
  });

  afterEach(() => http.verify());

  async function render() {
    const fixture = TestBed.createComponent(CheckoutPage);
    await fixture.whenStable();
    http.expectOne(`${API}/cart`).flush({ cart });
    await fixture.whenStable();
    return fixture;
  }

  function fillAndSubmit(el: HTMLElement) {
    const values: Record<string, string> = { full_name: 'Mario Rossi', address: 'Via Roma 1', city: 'Milano', postal_code: '20100' };
    for (const [id, value] of Object.entries(values)) {
      const input = el.querySelector<HTMLInputElement>(`#${id}`)!;
      input.value = value;
      input.dispatchEvent(new Event('input'));
    }
    el.querySelector('form')!.dispatchEvent(new Event('submit'));
  }

  it('precompila l’email e invia i dati, mostrando loading e conferma', async () => {
    const fixture = await render();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector<HTMLInputElement>('#email')!.value).toBe('u@x.it');

    fillAndSubmit(el);
    await fixture.whenStable();
    expect(el.textContent).toContain('Invio dell\'ordine in corso');

    const req = http.expectOne(`${API}/orders`);
    expect(req.request.body.order).toEqual({
      full_name: 'Mario Rossi', email: 'u@x.it', address: 'Via Roma 1', city: 'Milano', postal_code: '20100',
    });
    req.flush({ order: { id: 42, total: '20.0', status: 'pending', items: [] } }, { status: 201, statusText: 'Created' });
    http.expectOne(`${API}/cart`).flush({ cart: emptyCart });
    await fixture.whenStable();

    expect(el.textContent).toContain('Ordine #42 confermato');
  });

  it('in caso di errore mostra il messaggio e permette il retry', async () => {
    const fixture = await render();
    const el = fixture.nativeElement as HTMLElement;

    fillAndSubmit(el);
    http.expectOne(`${API}/orders`).flush({ error: 'Il carrello è vuoto' }, { status: 422, statusText: 'Unprocessable' });
    await fixture.whenStable();
    expect(el.querySelector('[role=alert]')!.textContent).toContain('Il carrello è vuoto');

    const retry = [...el.querySelectorAll('button')].find((b) => b.textContent?.includes('Riprova'))!;
    retry.click();
    http.expectOne(`${API}/orders`).flush({ order: { id: 43, total: '20.0', status: 'pending', items: [] } });
    http.expectOne(`${API}/cart`).flush({ cart: emptyCart });
    await fixture.whenStable();

    expect(el.textContent).toContain('Ordine #43 confermato');
  });
});
