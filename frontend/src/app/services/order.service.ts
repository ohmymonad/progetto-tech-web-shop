import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { API_URL } from '../core/api.config';
import { CustomerData, Order } from '../core/models';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  /** Crea l'ordine dal carrello dell'utente; il backend svuota il carrello. */
  create(customer: CustomerData): Observable<Order> {
    return this.http
      .post<{ order: Order }>(`${this.apiUrl}/orders`, { order: customer })
      .pipe(map((body) => body.order));
  }
}
