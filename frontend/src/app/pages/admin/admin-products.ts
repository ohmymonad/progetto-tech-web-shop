import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { errorMessage } from '../../core/http-error';
import { Product } from '../../core/models';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-admin-products',
  imports: [RouterLink, CurrencyPipe],
  template: `
    <h2>Admin · Prodotti</h2>
    <p><a routerLink="/admin/products/new">+ Nuovo prodotto</a> · <a routerLink="/admin/users">Utenti</a></p>

    @if (actionError()) {
      <p class="error" role="alert">{{ actionError() }}</p>
    }

    @if (loading()) {
      <p>Caricamento…</p>
    } @else if (error()) {
      <p class="error" role="alert">{{ error() }} <button type="button" (click)="load()">Riprova</button></p>
    } @else {
      <table>
        <thead>
          <tr><th>#</th><th>Nome</th><th>Categoria</th><th>Prezzo</th><th>Stock</th><th>Attivo</th><th></th></tr>
        </thead>
        <tbody>
          @for (p of products(); track p.id) {
            <tr>
              <td>{{ p.id }}</td>
              <td>{{ p.name }}</td>
              <td>{{ p.category }}</td>
              <td>{{ p.price | currency: 'EUR' }}</td>
              <td>{{ p.stock }}</td>
              <td>{{ p.active ? 'sì' : 'no' }}</td>
              <td>
                <a [routerLink]="['/admin/products', p.id, 'edit']">Modifica</a>
                <button type="button" (click)="remove(p)">Elimina</button>
              </td>
            </tr>
          }
        </tbody>
      </table>
    }
  `,
})
export class AdminProductsPage implements OnInit {
  private readonly admin = inject(AdminService);

  protected readonly products = signal<Product[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly actionError = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.admin.products().subscribe({
      next: (products) => {
        this.products.set(products);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }

  remove(product: Product): void {
    if (!confirm(`Eliminare "${product.name}"?`)) return;
    this.actionError.set(null);
    // Il backend rifiuta (422) i prodotti già presenti in carrelli o ordini.
    this.admin.deleteProduct(product.id).subscribe({
      next: () => this.products.update((list) => list.filter((p) => p.id !== product.id)),
      error: (err) => this.actionError.set(errorMessage(err)),
    });
  }
}
