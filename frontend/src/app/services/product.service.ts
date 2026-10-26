import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { API_URL } from '../core/api.config';
import { PageMeta, Product } from '../core/models';

export interface ProductQuery {
  q?: string;
  tag?: string;
  page?: number;
  per_page?: number;
}

export interface ProductPage {
  products: Product[];
  meta: PageMeta;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  list(query: ProductQuery = {}): Observable<ProductPage> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== '') params = params.set(key, String(value));
    }
    return this.http.get<ProductPage>(`${this.apiUrl}/products`, { params });
  }

  categories(): Observable<string[]> {
    return this.http.get<{ categories: string[] }>(`${this.apiUrl}/products/categories`).pipe(map((body) => body.categories));
  }

  get(id: number | string): Observable<Product> {
    return this.http.get<{ product: Product }>(`${this.apiUrl}/products/${id}`).pipe(map((body) => body.product));
  }
}
