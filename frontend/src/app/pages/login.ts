import { Component, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../core/auth.service';
import { errorMessage } from '../core/http-error';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
  <div class="auth-card">
    <h2>Login</h2>
    <form [formGroup]="form" (ngSubmit)="submit()">
      <p>
        <label for="email">Email</label><br />
        <input id="email" type="email" formControlName="email" autocomplete="username" />
      </p>
      <p>
        <label for="password">Password</label><br />
        <input id="password" type="password" formControlName="password" autocomplete="current-password" />
      </p>
      <button type="submit" [disabled]="form.invalid || loading()">
        {{ loading() ? 'Accesso in corso…' : 'Accedi' }}
      </button>
    </form>
    @if (error()) {
      <p class="error" role="alert">{{ error() }}</p>
    }
    <p class="alt">Non hai un account? <a routerLink="/signup">Registrati</a></p>
  </div>
  `,
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /** Query param impostato da guard e interceptor per tornare alla pagina richiesta. */
  readonly returnUrl = input<string>();

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly form = inject(NonNullableFormBuilder).group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  submit(): void {
    if (this.form.invalid) return;
    const { email, password } = this.form.getRawValue();
    this.loading.set(true);
    this.error.set(null);

    this.auth.login(email, password).subscribe({
      next: () => this.router.navigateByUrl(this.returnUrl() || '/'),
      error: (err) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }
}
