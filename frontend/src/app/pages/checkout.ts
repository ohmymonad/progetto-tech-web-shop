import { CurrencyPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AuthService } from '../core/auth.service';
import { errorMessage } from '../core/http-error';
import { Order } from '../core/models';
import { CartService } from '../services/cart.service';
import { OrderService } from '../services/order.service';

type SubmitState = 'idle' | 'loading' | 'success' | 'error';

@Component({
  selector: 'app-checkout',
  imports: [ReactiveFormsModule, RouterLink, CurrencyPipe],
  template: `
    <h2>Checkout</h2>

    @if (state() === 'success' && order(); as o) {
      <p class="success" role="status">
        Ordine #{{ o.id }} confermato! Totale {{ o.total | currency: 'EUR' }}.
      </p>
      <p><a [routerLink]="['/orders', o.id]">Vedi il dettaglio</a> · <a routerLink="/products">Continua lo shopping</a></p>
    } @else if (cart.cart(); as c) {
      @if (c.items.length === 0) {
        <p>Il carrello è vuoto: non c'è nulla da ordinare. <a routerLink="/products">Vai ai prodotti</a></p>
      } @else {
        <p>{{ cart.itemCount() }} articoli, totale <strong>{{ c.total | currency: 'EUR' }}</strong> (<a routerLink="/cart">modifica</a>)</p>

        <form [formGroup]="form" (ngSubmit)="submit()">
          <fieldset [disabled]="state() === 'loading'">
            <legend>Dati di spedizione</legend>
            @for (field of fields; track field.name) {
              <p>
                <label [for]="field.name">{{ field.label }}</label><br />
                <input [id]="field.name" [type]="field.type" [formControlName]="field.name" [attr.autocomplete]="field.autocomplete" />
                @if (form.controls[field.name].touched && form.controls[field.name].invalid) {
                  <br /><small class="error">{{ field.hint }}</small>
                }
              </p>
            }
            <button type="submit" [disabled]="form.invalid">Conferma ordine</button>
          </fieldset>
        </form>

        @if (state() === 'loading') {
          <p role="status">Invio dell'ordine in corso…</p>
        }
        @if (state() === 'error') {
          <p class="error" role="alert">
            Ordine non riuscito: {{ error() }}
            <button type="button" (click)="submit()">Riprova</button>
          </p>
        }
      }
    } @else {
      <p>Caricamento del carrello…</p>
    }
  `,
})
export class CheckoutPage {
  protected readonly cart = inject(CartService);
  private readonly orders = inject(OrderService);

  protected readonly state = signal<SubmitState>('idle');
  protected readonly error = signal<string | null>(null);
  protected readonly order = signal<Order | null>(null);

  protected readonly form = inject(NonNullableFormBuilder).group({
    full_name: ['', Validators.required],
    email: [inject(AuthService).currentUser()?.email ?? '', [Validators.required, Validators.email]],
    address: ['', Validators.required],
    city: ['', Validators.required],
    postal_code: ['', [Validators.required, Validators.pattern(/^\d{5}$/)]],
  });

  protected readonly fields = [
    { name: 'full_name', label: 'Nome e cognome', type: 'text', autocomplete: 'name', hint: 'Campo obbligatorio' },
    { name: 'email', label: 'Email', type: 'email', autocomplete: 'email', hint: "Inserisci un'email valida" },
    { name: 'address', label: 'Indirizzo', type: 'text', autocomplete: 'street-address', hint: 'Campo obbligatorio' },
    { name: 'city', label: 'Città', type: 'text', autocomplete: 'address-level2', hint: 'Campo obbligatorio' },
    { name: 'postal_code', label: 'CAP', type: 'text', autocomplete: 'postal-code', hint: 'Il CAP deve avere 5 cifre' },
  ] as const;

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.state.set('loading');
    this.error.set(null);

    this.orders.create(this.form.getRawValue()).subscribe({
      next: (order) => {
        this.order.set(order);
        this.state.set('success');
        this.form.reset();
        this.cart.load(); // il backend ha svuotato il carrello: si riallinea lo stato
      },
      error: (err) => {
        this.error.set(errorMessage(err));
        this.state.set('error');
      },
    });
  }
}
