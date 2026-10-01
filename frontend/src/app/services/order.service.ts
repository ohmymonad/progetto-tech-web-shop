import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { API_URL } from '../core/api.config';
import { CustomerData, Order, OrderStatus } from '../core/models';

/** Filtri di GET /orders; le date sono nel formato AAAA-MM-GG. */
export interface OrderFilters {
  status?: OrderStatus | '';
  from?: string;
  to?: string;
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  list(filters: OrderFilters = {}): Observable<Order[]> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value) params = params.set(key, value);
    }
    return this.http
      .get<{ orders: Order[] }>(`${this.apiUrl}/orders`, { params })
      .pipe(map((body) => body.orders));
  }

  get(id: number | string): Observable<Order> {
    return this.http.get<{ order: Order }>(`${this.apiUrl}/orders/${id}`).pipe(map((body) => body.order));
  }

  /** Crea l'ordine dal carrello dell'utente; il backend svuota il carrello. */
  create(customer: CustomerData): Observable<Order> {
    return this.http
      .post<{ order: Order }>(`${this.apiUrl}/orders`, { order: customer })
      .pipe(map((body) => body.order));
  }
}
