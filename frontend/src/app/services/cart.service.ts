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
  private readonly apiUrl = inject(API_URL); // passato come InjectionToken per poterlo mockare nei test
  private readonly auth = inject(AuthService); 

  private readonly state = signal<Cart | null>(null);
  readonly cart = this.state.asReadonly();
  readonly itemCount = computed(() => this.state()?.items.reduce((n, item) => n + item.quantity, 0) ?? 0);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  constructor() {
    // effetto che si attiva al login/logout e carica il carrello dal backend o resetta lo stato a null
    effect(() => {
      const user = this.auth.currentUser();
      untracked(() => (user ? this.load() : this.state.set(null)));
    });
  }
  // se l'utente è loggato, carica il carrello dal backend e aggiorna lo stato del servizio; altrimenti resetta lo stato a null
  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.http.get<{ cart: Cart }>(`${this.apiUrl}/cart`).subscribe({
      next: ({ cart }) => {
        this.state.set(cart);
        this.loading.set(false);
      },
      //ricordiamo che error viene eseguita quando la richiesta ritorna un codice di errore tipo 404 o 500
      error: (err) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }
  // metodi per aggiungere, aggiornare e rimuovere articoli dal carrello

  add(productId: number, quantity = 1): Observable<Cart> {
    return this.syncCart(this.http.post<{ cart: Cart }>(`${this.apiUrl}/cart/items`, { product_id: productId, quantity }));
  }

  update(itemId: number, quantity: number): Observable<Cart> {
    return this.syncCart(this.http.patch<{ cart: Cart }>(`${this.apiUrl}/cart/items/${itemId}`, { quantity }));
  }

  remove(itemId: number): Observable<Cart> {
    return this.syncCart(this.http.delete<{ cart: Cart }>(`${this.apiUrl}/cart/items/${itemId}`));
  }
  // riceve un observable con elementi di interfaccia Cart,\
  // ritorna un nuovo observable che mappa la risposta del backend al carrello, aggiorna lo stato e gestisce gli errori
  private syncCart(request: Observable<{ cart: Cart }>): Observable<Cart> {
    // ritorna nuovo observavle che mappa la risposta del backend al carrello, aggiorna lo stato e gestisce gli errori
    return request.pipe( 
      map((body) => body.cart), // ritorna solo il carrello dalla risposta del backend
      tap((cart) => this.state.set(cart)), // usiamo tap per modificare variabile di classe senza modificare il flusso dell'observable
      catchError((err) => {
        if (this.auth.isLoggedIn()) this.load(); 
        return throwError(() => err);
      }),
    );
  }
}
