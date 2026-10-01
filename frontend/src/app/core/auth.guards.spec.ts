import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';

import { adminGuard, authGuard, guestGuard } from './auth.guards';
import { AuthService } from './auth.service';
import { Role } from './models';

describe('route guard', () => {
  const route = {} as ActivatedRouteSnapshot;
  const state = { url: '/orders' } as RouterStateSnapshot;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
  });

  function logInAs(role: Role) {
    TestBed.inject(AuthService).login('a@b.it', 'x').subscribe();
    TestBed.inject(HttpTestingController)
      .expectOne('http://localhost:3000/auth/login')
      .flush({ user: { id: 1, email: 'a@b.it', role, created_at: '' } }, { headers: { Authorization: 'Bearer t' } });
  }

  const run = (guard: typeof authGuard) => TestBed.runInInjectionContext(() => guard(route, state));
  const url = (result: unknown) => TestBed.inject(Router).serializeUrl(result as UrlTree);

  it('authGuard rimanda al login con returnUrl', () => {
    expect(url(run(authGuard))).toBe('/login?returnUrl=%2Forders');
  });

  it('authGuard lascia passare un utente autenticato', () => {
    logInAs('user');
    expect(run(authGuard)).toBe(true);
  });

  it('adminGuard respinge un utente normale', () => {
    logInAs('user');
    expect(url(run(adminGuard))).toBe('/');
  });

  it('adminGuard lascia passare un admin', () => {
    logInAs('admin');
    expect(run(adminGuard)).toBe(true);
  });

  it('guestGuard respinge chi è già autenticato', () => {
    expect(run(guestGuard)).toBe(true);
    logInAs('user');
    expect(url(run(guestGuard))).toBe('/');
  });
});
