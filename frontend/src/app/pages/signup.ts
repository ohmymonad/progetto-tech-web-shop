import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../core/auth.service';
import { errorMessage } from '../core/http-error';

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const { password, confirmation } = group.value as { password: string; confirmation: string };
  return password === confirmation ? null : { mismatch: true };
}

@Component({
  selector: 'app-signup',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <h2>Registrazione</h2>
    <form [formGroup]="form" (ngSubmit)="submit()">
      <p>
        <label for="email">Email</label><br />
        <input id="email" type="email" formControlName="email" autocomplete="email" />
        @if (form.controls.email.touched && form.controls.email.invalid) {
          <br /><small class="error">Inserisci un'email valida</small>
        }
      </p>
      <p>
        <label for="password">Password (almeno 6 caratteri)</label><br />
        <input id="password" type="password" formControlName="password" autocomplete="new-password" />
      </p>
      <p>
        <label for="confirmation">Conferma password</label><br />
        <input id="confirmation" type="password" formControlName="confirmation" autocomplete="new-password" />
        @if (form.controls.confirmation.touched && form.hasError('mismatch')) {
          <br /><small class="error">Le password non coincidono</small>
        }
      </p>
      <button type="submit" [disabled]="form.invalid || loading()">
        {{ loading() ? 'Registrazione in corso…' : 'Crea account' }}
      </button>
    </form>
    @if (error()) {
      <p class="error" role="alert">{{ error() }}</p>
    }
    <p>Hai già un account? <a routerLink="/login">Accedi</a></p>
  `,
})
export class SignupPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly form = inject(NonNullableFormBuilder).group(
    {
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmation: ['', Validators.required],
    },
    { validators: passwordsMatch },
  );

  submit(): void {
    if (this.form.invalid) return;
    const { email, password } = this.form.getRawValue();
    this.loading.set(true);
    this.error.set(null);

    this.auth.signup(email, password).subscribe({
      next: () => this.router.navigateByUrl('/'),
      error: (err) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }
}
