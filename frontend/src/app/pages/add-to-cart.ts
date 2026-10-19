import { Component, inject, input, signal } from '@angular/core';

import { errorMessage } from '../core/http-error';
import { CartService } from '../services/cart.service';

/** Bottone "Aggiungi al carrello" con riscontro inline, usato da lista e dettaglio. */
@Component({
  selector: 'app-add-to-cart',
  template: `
    <button type="button" class="btn-cart" [disabled]="busy() || disabled()" (click)="add()">
      {{ busy() ? 'Aggiunta…' : 'Aggiungi al carrello' }}
    </button>
    <span role="status">
      @if (done()) { <small class="success">Aggiunto</small> }
      @if (error()) { <small class="error">{{ error() }}</small> }
    </span>
  `,
})
export class AddToCartButton {
  private readonly cart = inject(CartService);

  readonly productId = input.required<number>();
  readonly disabled = input(false);

  protected readonly busy = signal(false);
  protected readonly done = signal(false);
  protected readonly error = signal<string | null>(null);

  add(): void {
    this.busy.set(true);
    this.done.set(false);
    this.error.set(null);
    this.cart.add(this.productId()).subscribe({
      next: () => {
        this.busy.set(false);
        this.done.set(true);
      },
      error: (err) => {
        this.busy.set(false);
        this.error.set(errorMessage(err));
      },
    });
  }
}
