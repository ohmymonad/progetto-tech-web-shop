import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { errorMessage } from '../core/http-error';
import { Order } from '../core/models';
import { OrderService } from '../services/order.service';
import { STATUS_LABELS } from './orders';

@Component({
  selector: 'app-order-detail',
  imports: [RouterLink, CurrencyPipe, DatePipe],
  template: `
    <p><a routerLink="/orders">← Tutti gli ordini</a></p>
    @if (loading()) {
      <p>Caricamento…</p>
    } @else if (error()) {
      <p class="error" role="alert">{{ error() }} <button type="button" (click)="load()">Riprova</button></p>
    } @else if (order(); as o) {
      <h2>Ordine #{{ o.id }}</h2>
      <dl>
        <dt>Data</dt><dd>{{ o.created_at | date: 'dd/MM/yyyy HH:mm' }}</dd>
        <dt>Stato</dt><dd>{{ labels[o.status] }}</dd>
        <dt>Cliente</dt><dd>{{ o.full_name }} &lt;{{ o.email }}&gt;</dd>
        <dt>Spedizione</dt><dd>{{ o.address }}, {{ o.postal_code }} {{ o.city }}</dd>
      </dl>
      <table>
        <thead>
          <tr><th>Prodotto</th><th>Prezzo al momento dell'ordine</th><th>Quantità</th><th>Subtotale</th></tr>
        </thead>
        <tbody>
          @for (item of o.items; track item.id) {
            <tr>
              <td><a [routerLink]="['/products', item.product_id]">{{ item.name }}</a></td>
              <td>{{ item.unit_price | currency: 'EUR' }}</td>
              <td>{{ item.quantity }}</td>
              <td>{{ item.subtotal | currency: 'EUR' }}</td>
            </tr>
          }
        </tbody>
      </table>
      <p><strong>Totale: {{ o.total | currency: 'EUR' }}</strong></p>
    }
  `,
})
export class OrderDetailPage implements OnInit {
  private readonly orderService = inject(OrderService);

  /** Parametro di rotta `:id`. */
  readonly id = input.required<string>();

  protected readonly labels = STATUS_LABELS;
  protected readonly order = signal<Order | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.orderService.get(this.id()).subscribe({
      next: (order) => {
        this.order.set(order);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }
}
