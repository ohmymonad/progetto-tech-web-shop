import { CurrencyPipe } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

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
      <label for="tag">Categoria</label>
      <select id="tag" formControlName="tag" (change)="search()">
        <option value="">Tutte le categorie</option>
        @for (category of categories(); track category) {
          <option [value]="category">{{ category }}</option>
        }
      </select>
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
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly products = signal<Product[]>([]);
  protected readonly categories = signal<string[]>([]);
  protected readonly meta = signal<PageMeta | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly filters = inject(NonNullableFormBuilder).group({
    q: [''],
    tag: [''],
    per_page: [10],
  });
  private page = 1;

  ngOnInit(): void {
    this.productService.categories().subscribe({ next: (categories) => this.categories.set(categories) });

    // L'URL (?q=&tag=&page=&per_page=) è la fonte di verità: ogni cambio ripopola il form e ricarica.
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.filters.patchValue(
        {
          q: params.get('q') ?? '',
          tag: params.get('tag') ?? '',
          per_page: Number(params.get('per_page')) || 10,
        },
        { emitEvent: false },
      );
      this.page = Math.max(Number(params.get('page')) || 1, 1);
      this.load();
    });
  }

  search(): void {
    this.navigate(1);
  }

  reset(): void {
    this.filters.reset();
    this.search();
  }

  goTo(page: number): void {
    this.navigate(page);
  }

  // Scrive i filtri nell'URL omettendo quelli vuoti; il caricamento parte dalla sottoscrizione a queryParamMap.
  private navigate(page: number): void {
    const { q, tag, per_page } = this.filters.getRawValue();
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { q: q.trim() || null, tag: tag || null, page: page > 1 ? page : null, per_page },
    });
  }

  load(): void {
    const { q, tag, per_page } = this.filters.getRawValue();
    this.loading.set(true);
    this.error.set(null);

    this.productService.list({ q: q.trim(), tag, page: this.page, per_page }).subscribe({
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
