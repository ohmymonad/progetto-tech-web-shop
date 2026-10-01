import { HttpClient } from '@angular/common/http';
import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { Observable, catchError, map, tap, throwError } from 'rxjs';

import { API_URL } from '../core/api.config';
import { AuthService } from '../core/auth.service';
import { errorMessage } from '../core/http-error';
import { Cart } from '../core/models';

/**
 * Il carrello vive sul backend: questo servizio ne tiene solo lo specchio.
 * Si carica da GET /cart al login (o al reload con token valido) e dopo ogni
 * mutazione adotta il carrello restituito dal backend; se una mutazione
 * fallisce, si riallinea rileggendo GET /cart.
 */
@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);
  private readonly auth = inject(AuthService);

  private readonly state = signal<Cart | null>(null);
  readonly cart = this.state.asReadonly();
  readonly itemCount = computed(() => this.state()?.items.reduce((n, item) => n + item.quantity, 0) ?? 0);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  constructor() {
    effect(() => {
      const user = this.auth.currentUser();
      untracked(() => (user ? this.load() : this.state.set(null)));
    });
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.http.get<{ cart: Cart }>(`${this.apiUrl}/cart`).subscribe({
      next: ({ cart }) => {
        this.state.set(cart);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }

  add(productId: number, quantity = 1): Observable<Cart> {
    return this.sync(this.http.post<{ cart: Cart }>(`${this.apiUrl}/cart/items`, { product_id: productId, quantity }));
  }

  update(itemId: number, quantity: number): Observable<Cart> {
    return this.sync(this.http.patch<{ cart: Cart }>(`${this.apiUrl}/cart/items/${itemId}`, { quantity }));
  }

  remove(itemId: number): Observable<Cart> {
    return this.sync(this.http.delete<{ cart: Cart }>(`${this.apiUrl}/cart/items/${itemId}`));
  }

  private sync(request: Observable<{ cart: Cart }>): Observable<Cart> {
    return request.pipe(
      map((body) => body.cart),
      tap((cart) => this.state.set(cart)),
      catchError((err) => {
        if (this.auth.isLoggedIn()) this.load();
        return throwError(() => err);
      }),
    );
  }
}
