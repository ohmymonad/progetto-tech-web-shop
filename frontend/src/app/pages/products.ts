import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { errorMessage } from '../core/http-error';
import { PageMeta, Product } from '../core/models';
import { ProductService } from '../services/product.service';
import { AddToCartButton } from './add-to-cart';

@Component({
  selector: 'app-products',
  imports: [ReactiveFormsModule, RouterLink, CurrencyPipe, AddToCartButton],
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
        <p class="empty">Nessun prodotto trovato.</p>
      } @else {
        <div class="grid">
          @for (product of products(); track product.id) {
            <article class="card">
              <a class="thumb" [routerLink]="['/products', product.id]" [style.--hue]="(product.id * 47) % 360" aria-hidden="true" tabindex="-1">
                {{ product.name.charAt(0).toUpperCase() }}
              </a>
              <div class="body">
                @if (product.category) { <span class="category">{{ product.category }}</span> }
                <h3><a [routerLink]="['/products', product.id]">{{ product.name }}</a></h3>
                <span class="price">{{ product.price | currency: 'EUR' }}</span>
                @if (product.stock === 0) {
                  <span class="stock-out">Non disponibile</span>
                } @else if (product.stock <= 5) {
                  <span class="stock-low">Ne restano solo {{ product.stock }}</span>
                } @else {
                  <span class="stock-ok">Disponibile</span>
                }
                <div class="actions"><app-add-to-cart [productId]="product.id" [disabled]="product.stock === 0" /></div>
              </div>
            </article>
          }
        </div>
      }
      @if (meta(); as m) {
        <p class="pager">
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
