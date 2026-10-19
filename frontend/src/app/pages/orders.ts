import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { errorMessage } from '../core/http-error';
import { Order, OrderStatus } from '../core/models';
import { OrderService } from '../services/order.service';

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'In attesa',
  paid: 'Pagato',
  shipped: 'Spedito',
  cancelled: 'Annullato',
};

@Component({
  selector: 'app-orders',
  imports: [ReactiveFormsModule, RouterLink, CurrencyPipe, DatePipe],
  template: `
    <h2>I miei ordini</h2>

    <form [formGroup]="filters" (ngSubmit)="load()" role="search">
      <label for="status">Stato</label>
      <select id="status" formControlName="status">
        <option value="">Tutti</option>
        @for (s of statuses; track s) {
          <option [value]="s">{{ labels[s] }}</option>
        }
      </select>
      <label for="from">Dal</label>
      <input id="from" type="date" formControlName="from" />
      <label for="to">Al</label>
      <input id="to" type="date" formControlName="to" />
      <button type="submit">Filtra</button>
      <button type="button" (click)="reset()">Azzera</button>
    </form>

    @if (loading()) {
      <p>Caricamento…</p>
    } @else if (error()) {
      <p class="error" role="alert">{{ error() }} <button type="button" (click)="load()">Riprova</button></p>
    } @else if (orders().length === 0) {
      <p class="empty">Nessun ordine trovato.</p>
    } @else {
      <table>
        <thead>
          <tr><th>#</th><th>Data</th><th>Stato</th><th>Articoli</th><th>Totale</th></tr>
        </thead>
        <tbody>
          @for (order of orders(); track order.id) {
            <tr>
              <td><a [routerLink]="['/orders', order.id]">{{ order.id }}</a></td>
              <td>{{ order.created_at | date: 'dd/MM/yyyy HH:mm' }}</td>
              <td><span class="status status-{{ order.status }}">{{ labels[order.status] }}</span></td>
              <td>{{ order.items.length }}</td>
              <td>{{ order.total | currency: 'EUR' }}</td>
            </tr>
          }
        </tbody>
      </table>
    }
  `,
})
export class OrdersPage implements OnInit {
  private readonly orderService = inject(OrderService);

  protected readonly labels = STATUS_LABELS;
  protected readonly statuses = Object.keys(STATUS_LABELS) as OrderStatus[];
  protected readonly orders = signal<Order[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly filters = inject(NonNullableFormBuilder).group({
    status: ['' as OrderStatus | ''],
    from: [''],
    to: [''],
  });

  ngOnInit(): void {
    this.load();
  }

  reset(): void {
    this.filters.reset();
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.orderService.list(this.filters.getRawValue()).subscribe({
      next: (orders) => {
        this.orders.set(orders);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }
}
