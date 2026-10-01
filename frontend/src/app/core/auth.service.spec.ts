import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { AuthService } from './auth.service';

const user = { id: 1, email: 'user@example.com', role: 'user' as const, created_at: '2026-10-01' };

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('salva il token dall’header Authorization al login', () => {
    service.login('user@example.com', 'password123').subscribe();

    const req = http.expectOne('http://localhost:3000/auth/login');
    expect(req.request.body).toEqual({ user: { email: 'user@example.com', password: 'password123' } });
    req.flush({ user }, { headers: { Authorization: 'Bearer abc.def.ghi' } });

    expect(service.token()).toBe('abc.def.ghi');
    expect(service.currentUser()).toEqual(user);
    expect(service.isAdmin()).toBe(false);
  });

  it('chiude la sessione se /auth/me risponde 401', () => {
    localStorage.setItem('shop.jwt', 'scaduto');
    service.restoreSession().subscribe();

    http.expectOne('http://localhost:3000/auth/me').flush({ error: 'x' }, { status: 401, statusText: 'Unauthorized' });

    expect(service.token()).toBeNull();
    expect(service.isLoggedIn()).toBe(false);
  });

  it('il logout pulisce la sessione anche se il backend fallisce', () => {
    localStorage.setItem('shop.jwt', 'tok');
    service.logout().subscribe();

    http.expectOne('http://localhost:3000/auth/logout').flush(null, { status: 500, statusText: 'Error' });

    expect(service.token()).toBeNull();
  });
});
