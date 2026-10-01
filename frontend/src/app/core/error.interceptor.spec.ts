import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';

import { errorInterceptor } from './error.interceptor';
import { errorMessage } from './http-error';

describe('errorInterceptor', () => {
  let client: HttpClient;
  let http: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    client = TestBed.inject(HttpClient);
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  afterEach(() => http.verify());

  it('su 401 chiude la sessione e rimanda al login', () => {
    localStorage.setItem('shop.jwt', 'scaduto');
    client.get('http://localhost:3000/cart').subscribe({ error: () => {} });

    http.expectOne('http://localhost:3000/cart').flush({ error: 'x' }, { status: 401, statusText: 'Unauthorized' });

    expect(localStorage.getItem('shop.jwt')).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/login'], { queryParams: { returnUrl: '/' } });
  });

  it('non interviene sul 401 di credenziali errate', () => {
    client.post('http://localhost:3000/auth/login', {}).subscribe({ error: () => {} });

    http.expectOne('http://localhost:3000/auth/login').flush({ error: 'x' }, { status: 401, statusText: 'Unauthorized' });

    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('propaga il messaggio del backend', () => {
    let message = '';
    client.get('http://localhost:3000/orders/9').subscribe({ error: (e) => (message = errorMessage(e)) });

    http.expectOne('http://localhost:3000/orders/9').flush({ error: 'Risorsa non trovata: Order' }, { status: 404, statusText: 'Not Found' });

    expect(message).toBe('Risorsa non trovata: Order');
  });
});
