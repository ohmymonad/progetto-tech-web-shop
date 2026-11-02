import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { API_URL } from '../core/api.config';
import { Category, Product, User } from '../core/models';

export type ProductInput = Omit<Product, 'id' | 'price' | 'category'> & { price: number | string };

/** Endpoint /admin/*: il backend risponde 403 a chi non è admin. */
@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly base = `${inject(API_URL)}/admin`;

  products(): Observable<Product[]> {
    return this.http.get<{ products: Product[] }>(`${this.base}/products`).pipe(map((b) => b.products));
  }

  product(id: number | string): Observable<Product> {
    return this.http.get<{ product: Product }>(`${this.base}/products/${id}`).pipe(map((b) => b.product));
  }

  createProduct(product: ProductInput): Observable<Product> {
    return this.http.post<{ product: Product }>(`${this.base}/products`, { product }).pipe(map((b) => b.product));
  }

  updateProduct(id: number | string, product: ProductInput): Observable<Product> {
    return this.http
      .patch<{ product: Product }>(`${this.base}/products/${id}`, { product })
      .pipe(map((b) => b.product));
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete(`${this.base}/products/${id}`).pipe(map(() => undefined));
  }

  categories(): Observable<Category[]> {
    return this.http.get<{ categories: Category[] }>(`${this.base}/categories`).pipe(map((b) => b.categories));
  }

  createCategory(name: string): Observable<Category> {
    return this.http
      .post<{ category: Category }>(`${this.base}/categories`, { category: { name } })
      .pipe(map((b) => b.category));
  }

  renameCategory(id: number, name: string): Observable<Category> {
    return this.http
      .patch<{ category: Category }>(`${this.base}/categories/${id}`, { category: { name } })
      .pipe(map((b) => b.category));
  }

  /** I prodotti della categoria eliminata passano a "non-categorized". */
  deleteCategory(id: number): Observable<void> {
    return this.http.delete(`${this.base}/categories/${id}`).pipe(map(() => undefined));
  }

  users(): Observable<User[]> {
    return this.http.get<{ users: User[] }>(`${this.base}/users`).pipe(map((b) => b.users));
  }

  user(id: number | string): Observable<User> {
    return this.http.get<{ user: User }>(`${this.base}/users/${id}`).pipe(map((b) => b.user));
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete(`${this.base}/users/${id}`).pipe(map(() => undefined));
  }
}
