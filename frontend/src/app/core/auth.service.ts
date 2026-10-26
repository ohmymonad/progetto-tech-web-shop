import { HttpClient, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, tap, finalize } from 'rxjs';

import { API_URL } from './api.config';
import { User } from './models';

const TOKEN_KEY = 'shop.jwt';

/**
 * Stato di autenticazione: il JWT vive in localStorage (sopravvive al reload),
 * l'utente corrente in un signal. Il token viene emesso dal backend nell'header
 * `Authorization` delle risposte di login e signup.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  private readonly user = signal<User | null>(null);
  readonly currentUser = this.user.asReadonly();
  readonly isLoggedIn = computed(() => this.user() !== null);
  readonly isAdmin = computed(() => this.user()?.role === 'admin');

    //ritorna il token JWT salvato in localStorage, o null se non c'è
  token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }
  // ritorna un observable che emette l'utente corrente se c'è un token valido, altrimenti null
  login(email: string, password: string): Observable<User> {
    return this.http
      .post<{ user: User }>(`${this.apiUrl}/auth/login`, { user: { email, password } }, { observe: 'response' })
      .pipe(map((res) => this.storeSession(res)));
  }
  // ritorna un observable che emette l'utente appena creato se la registrazione va a buon fine, altrimenti lancia un errore
  signup(email: string, password: string): Observable<User> {
    return this.http
      .post<{ user: User }>(`${this.apiUrl}/auth/signup`, { user: { email, password } }, { observe: 'response' })
      .pipe(map((res) => this.storeSession(res)));
  }

  /** Revoca il token sul backend; la sessione locale viene chiusa in ogni caso. */
  logout(): Observable<void> {
    return this.http.delete(`${this.apiUrl}/auth/logout`).pipe(
      map(() => undefined),
      catchError(() => of(undefined)),
      finalize(() => this.clearSession()),
    );
  }

  /** All'avvio: se c'è un token, ricarica l'utente da GET /auth/me. */
  
  clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    this.user.set(null);
  }

  restoreSession(): Observable<User | null> {
    if (!this.token()) return of(null); //se non abbiamo token, ritorniamo subito null
    // se abbiamo token, chiamiamo il backend per ottenere l'utente corrente
    // al subscribe di questo observable, se la richiesta va a buon fine, viene settato il signal user con l'utente corrente
    // altrimenti riceve un errore 401 e viene chiamata clearSession() per rimuovere il token e settare user a null
    return this.http.get<{ user: User }>(`${this.apiUrl}/auth/me`).pipe(
      map((body) => body.user),
      tap((user) => this.user.set(user)),
      catchError((err: HttpErrorResponse) => {
        //in caso di errore, rimuove dal localStorage il token e setta il signal user a null
        if (err.status === 401) this.clearSession();
        return of(null);
      }),
    );
  }

  // salviamo in localStorage il token JWT e in un signal l'utente corrente
  private storeSession(res: HttpResponse<{ user: User }>): User {
    const token = res.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
    if (!token || !res.body) throw new Error('Risposta di autenticazione senza token');
    localStorage.setItem(TOKEN_KEY, token);
    this.user.set(res.body.user);
    return res.body.user;
  }
}
