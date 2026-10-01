import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { errorMessage } from '../core/http-error';
import { PageMeta, Product } from '../core/models';
import { ProductService } from '../services/product.service';

@Component({
  selector: 'app-products',
  imports: [ReactiveFormsModule, RouterLink, CurrencyPipe],
  template: `
    <h2>Prodotti</h2>

    <form [formGroup]="filters" (ngSubmit)="search()" role="search">
      <label for="q">Cerca</label>
      <input id="q" type="search" formControlName="q" />
      <label for="category">Categoria</label>
      <input id="category" type="text" formControlName="category" />
      <label for="per_page">Per pagina</label>
      <select id="per_page" formControlName="per_page">
        <option [ngValue]="5">5</option>
        <option [ngValue]="10">10</option>
        <option [ngValue]="20">20</option>
      </select>
      <button type="submit">Filtra</button>
      <button type="button" (click)="reset()">Azzera</button>
    </form>

    @if (loading()) {
      <p>Caricamento…</p>
    } @else if (error()) {
      <p class="error" role="alert">{{ error() }} <button type="button" (click)="load()">Riprova</button></p>
    } @else {
      @if (products().length === 0) {
        <p>Nessun prodotto trovato.</p>
      } @else {
        <table>
          <thead>
            <tr><th>Nome</th><th>Categoria</th><th>Prezzo</th><th>Disponibilità</th></tr>
          </thead>
          <tbody>
            @for (product of products(); track product.id) {
              <tr>
                <td><a [routerLink]="['/products', product.id]">{{ product.name }}</a></td>
                <td>{{ product.category }}</td>
                <td>{{ product.price | currency: 'EUR' }}</td>
                <td>{{ product.stock }}</td>
              </tr>
            }
          </tbody>
        </table>
      }
      @if (meta(); as m) {
        <p>
          <button type="button" (click)="goTo(m.page - 1)" [disabled]="m.page <= 1">← Precedente</button>
          Pagina {{ m.page }} di {{ m.total_pages || 1 }} ({{ m.total }} prodotti)
          <button type="button" (click)="goTo(m.page + 1)" [disabled]="m.page >= m.total_pages">Successiva →</button>
        </p>
      }
    }
  `,
})
export class ProductsPage implements OnInit {
  private readonly productService = inject(ProductService);

  protected readonly products = signal<Product[]>([]);
  protected readonly meta = signal<PageMeta | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly filters = inject(NonNullableFormBuilder).group({
    q: [''],
    category: [''],
    per_page: [10],
  });
  private page = 1;

  ngOnInit(): void {
    this.load();
  }

  search(): void {
    this.page = 1;
    this.load();
  }

  reset(): void {
    this.filters.reset();
    this.search();
  }

  goTo(page: number): void {
    this.page = page;
    this.load();
  }

  load(): void {
    const { q, category, per_page } = this.filters.getRawValue();
    this.loading.set(true);
    this.error.set(null);

    this.productService.list({ q: q.trim(), category: category.trim(), page: this.page, per_page }).subscribe({
      next: ({ products, meta }) => {
        this.products.set(products);
        this.meta.set(meta);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }
}
