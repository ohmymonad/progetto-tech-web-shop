import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { errorMessage } from '../core/http-error';
import { Product } from '../core/models';
import { ProductService } from '../services/product.service';
import { AddToCartButton } from './add-to-cart';

@Component({
  selector: 'app-product-detail',
  imports: [RouterLink, CurrencyPipe, AddToCartButton],
  template: `
    <p><a routerLink="/products">← Tutti i prodotti</a></p>
    @if (loading()) {
      <p>Caricamento…</p>
    } @else if (error()) {
      <p class="error" role="alert">{{ error() }} <button type="button" (click)="load()">Riprova</button></p>
    } @else if (product(); as p) {
      <div class="product-layout">
        <!-- colore del thumb basato sull'id del prodotto, per avere un colore diverso per ogni prodotto -->
        <div class="thumb" [style.--hue]="(p.id * 47) % 360" aria-hidden="true">{{ p.name.charAt(0).toUpperCase() }}</div>
        <section>
          @if (p.category) { <span class="category">{{ p.category }}</span> }
          <h2>{{ p.name }}</h2>
          <p>{{ p.description }}</p>
          <dl class="facts">
            <dt>Categoria</dt><dd>{{ p.category }}</dd>
            <dt>Disponibilità</dt><dd>{{ p.stock }}</dd>
          </dl>
        </section>
        <aside class="buybox">
          <span class="price price-lg">{{ p.price | currency: 'EUR' }}</span>
          @if (p.stock > 0 && p.active) {
            <span class="stock-ok">Disponibile</span>
          } @else {
            <span class="stock-out">Non disponibile</span>
          }
          <app-add-to-cart [productId]="p.id" [disabled]="p.stock === 0 || !p.active" />
        </aside>
      </div>
    }
  `,
})
export class ProductDetailPage implements OnInit {
  private readonly productService = inject(ProductService);

  /** Parametro di rotta `:id`. */
  readonly id = input.required<string>();

  protected readonly product = signal<Product | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.productService.get(this.id()).subscribe({
      next: (product) => {
        this.product.set(product);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }
}
