import { InjectionToken } from '@angular/core';

/** Base URL del backend Rails (esposto da docker-compose sulla porta 3000). */
export const API_URL = new InjectionToken<string>('API_URL', {
  providedIn: 'root',
  factory: () => 'http://localhost:3000',
});
