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
      <h2>{{ p.name }}</h2>
      <p>{{ p.description }}</p>
      <dl>
        <dt>Categoria</dt><dd>{{ p.category }}</dd>
        <dt>Prezzo</dt><dd>{{ p.price | currency: 'EUR' }}</dd>
        <dt>Disponibilità</dt><dd>{{ p.stock }}</dd>
      </dl>
      <app-add-to-cart [productId]="p.id" [disabled]="p.stock === 0 || !p.active" />
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
