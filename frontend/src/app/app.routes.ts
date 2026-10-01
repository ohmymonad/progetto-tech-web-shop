import { Routes } from '@angular/router';

import { guestGuard } from './core/auth.guards';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'products' },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/login').then((m) => m.LoginPage),
  },
  {
    path: 'signup',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/signup').then((m) => m.SignupPage),
  },
  { path: '**', loadComponent: () => import('./pages/not-found').then((m) => m.NotFoundPage) },
];
