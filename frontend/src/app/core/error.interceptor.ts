import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthService } from './auth.service';

// Su queste rotte un 401 significa "credenziali errate", non "token scaduto".
const CREDENTIAL_ENDPOINTS = ['/auth/login', '/auth/signup'];

/**
 * Un 401 su qualsiasi API indica JWT scaduto o revocato: si chiude la sessione
 * e si rimanda al login, ricordando la pagina da cui riprendere.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((err: unknown) => {
      const isCredentialCheck = CREDENTIAL_ENDPOINTS.some((path) => req.url.endsWith(path));
      if (err instanceof HttpErrorResponse && err.status === 401 && !isCredentialCheck) {
        auth.clearSession();
        const returnUrl = router.url.startsWith('/login') ? undefined : router.url;
        router.navigate(['/login'], { queryParams: { returnUrl } });
      }
      return throwError(() => err);
    }),
  );
};
