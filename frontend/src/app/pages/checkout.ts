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
  <!-- RICORDIAMO CHE A OGNI AGGIORNAMENTO DI STATO, VENGONO RICONTROLLATI TUTTI QUESTI @if e @else -->
    <h2>Checkout</h2>
   <!-- appare se il checkout è andato a buon fine....-->
    @if (state() === 'success' && order(); as o) {
      <p class="success" role="status">
        Ordine #{{ o.id }} confermato! Totale {{ o.total | currency: 'EUR' }}.
      </p>
      <p><a [routerLink]="['/orders', o.id]">Vedi il dettaglio</a> · <a routerLink="/products">Continua lo shopping</a></p>
    } 
     <!-- .... altrimenti...-->

    @else if (cart.cart(); as c) {
      @if (c.items.length === 0) {
        <p>Il carrello è vuoto: non c'è nulla da ordinare. <a routerLink="/products">Vai ai prodotti</a></p>
      } 
      @else {
        <p>{{ cart.itemCount() }} articoli, totale <strong>{{ c.total | currency: 'EUR' }}</strong> (<a routerLink="/cart">modifica</a>)</p>
        
        <!-- ngSubmit intercetta l'EVENTO DEL SUBMIT del form e chiama il metodo submit() della classe CheckoutPage -->
        <form [formGroup]="form" (ngSubmit)="submit()">
          <!-- il fieldset viene disabilitato mentre l'ordine è in invio (state === 'loading') -->
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
            <button type="submit" [disabled]="form.invalid || state() === 'loading'">Conferma ordine</button>
            <!-- TEST: usa la route farlocca che fallisce sempre dopo 5s -->
            <button type="button" [disabled]="form.invalid || state() === 'loading'" (click)="submit(true)">Simula ordine fallito</button>
          </fieldset>
        </form>

        @if (state() === 'loading') {
          <p class="loading" role="status"><strong>Loading…</strong> Invio dell'ordine in corso…</p>
        }
        @if (state() === 'error') {
          <p class="error" role="alert">
            Ordine non riuscito: {{ error() }}
            <button type="button" (click)="submit(lastSimulated)">Riprova</button>
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

  // inizializza il form con i dati dell'utente loggato
  // il form builder è iniettato come NonNullableFormBuilder per evitare che i controlli possano essere null
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
  // funzione per inviare l'ordine al backend:
  //  se il form è valido, chiama il servizio OrderService.create()
  //  e gestisce lo stato di caricamento, successo o errore
  // simulateFailure=true usa la route farlocca POST /orders/fail (solo per test)
  protected lastSimulated = false;

  submit(simulateFailure = false): void {
    // se il form non è valido, segna tutti i campi come toccati e ritorna
    // ricordiamo che il form e' invalido se almeno un controllo e' invalido
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    // se il form e' valido ..
    this.state.set('loading');
    this.error.set(null);
    // al subscribe del servizio OrderService.create() viene lanciata la richiesta POST /orders con i dati del form (full_name, email, address, city, postal_code)
    // e viene gestito qua la response(next per ok, error per codice HTTP di erore tipo 400 o 500)
    this.lastSimulated = simulateFailure;
    const request = simulateFailure ? this.orders.createFailing : this.orders.create;
    request.call(this.orders, this.form.getRawValue()).subscribe({
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
