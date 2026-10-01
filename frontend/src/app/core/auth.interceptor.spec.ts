import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let client: HttpClient;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting()],
    });
    client = TestBed.inject(HttpClient);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('aggiunge il Bearer token verso il backend', () => {
    localStorage.setItem('shop.jwt', 'tok');
    client.get('http://localhost:3000/cart').subscribe();

    expect(http.expectOne('http://localhost:3000/cart').request.headers.get('Authorization')).toBe('Bearer tok');
  });

  it('non invia il token ad altri domini', () => {
    localStorage.setItem('shop.jwt', 'tok');
    client.get('https://example.com/x').subscribe();

    expect(http.expectOne('https://example.com/x').request.headers.has('Authorization')).toBe(false);
  });

  it('senza token lascia la richiesta invariata', () => {
    client.get('http://localhost:3000/products').subscribe();

    expect(http.expectOne('http://localhost:3000/products').request.headers.has('Authorization')).toBe(false);
  });
});
