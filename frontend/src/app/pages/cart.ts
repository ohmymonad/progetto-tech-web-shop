import { CurrencyPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';

import { errorMessage } from '../core/http-error';
import { Cart, LineItem } from '../core/models';
import { CartService } from '../services/cart.service';

@Component({
  selector: 'app-cart',
  imports: [RouterLink, CurrencyPipe],
  template: `
    <h2>Carrello</h2>

    @if (actionError()) {
      <p class="error" role="alert">{{ actionError() }}</p>
    }

    @if (cartService.loading() && !cartService.cart()) {
      <p>Caricamento…</p>
    } @else if (cartService.error()) {
      <p class="error" role="alert">
        {{ cartService.error() }} <button type="button" (click)="cartService.load()">Riprova</button>
      </p>
    } @else if (cartService.cart(); as cart) {
      @if (cart.items.length === 0) {
        <p class="empty">Il carrello è vuoto. <a routerLink="/products">Vai ai prodotti</a></p>
      } @else {
        <div class="cart-layout">
        <table>
          <thead>
            <tr><th>Prodotto</th><th>Prezzo</th><th>Quantità</th><th>Subtotale</th><th></th></tr>
          </thead>
          <tbody>
            @for (item of cart.items; track item.id) {
              <tr>
                <td><a [routerLink]="['/products', item.product_id]">{{ item.name }}</a></td>
                <td>{{ item.unit_price | currency: 'EUR' }}</td>
                <td>
                  <label class="visually-hidden" [for]="'qty-' + item.id">Quantità di {{ item.name }}</label>
                  <input #qty [id]="'qty-' + item.id" type="number" min="1" [value]="item.quantity" style="width: 4.5rem" />
                  <button type="button" [disabled]="busy()" (click)="update(item, qty.valueAsNumber)">Aggiorna</button>
                </td>
                <td>{{ item.subtotal | currency: 'EUR' }}</td>
                <td><button type="button" [disabled]="busy()" (click)="remove(item)">Rimuovi</button></td>
              </tr>
            }
          </tbody>
        </table>
        <aside class="summary">
          <span>Totale ({{ cartService.itemCount() }} articoli)</span>
          <strong class="price total">{{ cart.total | currency: 'EUR' }}</strong>
          <a class="btn-link" routerLink="/checkout">Procedi al checkout</a>
        </aside>
        </div>
      }
    }
  `,
})
export class CartPage {
  protected readonly cartService = inject(CartService);
  protected readonly busy = signal(false);
  protected readonly actionError = signal<string | null>(null);

  update(item: LineItem, quantity: number): void {
    if (quantity === item.quantity) return;
    this.run(this.cartService.update(item.id, quantity));
  }

  remove(item: LineItem): void {
    this.run(this.cartService.remove(item.id));
  }

  private run(action: Observable<Cart>): void {
    this.busy.set(true);
    this.actionError.set(null);
    action.subscribe({
      next: () => this.busy.set(false),
      error: (err) => {
        this.actionError.set(errorMessage(err));
        this.busy.set(false);
      },
    });
  }
}
