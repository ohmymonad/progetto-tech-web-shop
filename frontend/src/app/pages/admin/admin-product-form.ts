import { Component, OnInit, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { errorMessage } from '../../core/http-error';
import { AdminService } from '../../services/admin.service';

/** Creazione (`/admin/products/new`) e modifica (`/admin/products/:id/edit`) di un prodotto. */
@Component({
  selector: 'app-admin-product-form',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <p><a routerLink="/admin/products">← Prodotti</a></p>
    <h2>{{ id() ? 'Modifica prodotto #' + id() : 'Nuovo prodotto' }}</h2>

    @if (loading()) {
      <p>Caricamento…</p>
    } @else {
      <form [formGroup]="form" (ngSubmit)="save()">
        <fieldset [disabled]="saving()">
          <p>
            <label for="name">Nome</label><br />
            <input id="name" formControlName="name" />
          </p>
          <p>
            <label for="description">Descrizione</label><br />
            <textarea id="description" formControlName="description" rows="3" cols="40"></textarea>
          </p>
          <p>
            <label for="price">Prezzo (€)</label><br />
            <input id="price" type="number" step="0.01" min="0.01" formControlName="price" />
            @if (form.controls.price.touched && form.controls.price.invalid) {
              <br /><small class="error">Il prezzo deve essere maggiore di zero</small>
            }
          </p>
          <p>
            <label for="stock">Stock</label><br />
            <input id="stock" type="number" step="1" min="0" formControlName="stock" />
            @if (form.controls.stock.touched && form.controls.stock.invalid) {
              <br /><small class="error">Lo stock deve essere un intero ≥ 0</small>
            }
          </p>
          <p>
            <label for="category">Categoria</label><br />
            <input id="category" formControlName="category" />
          </p>
          <p>
            <label><input type="checkbox" formControlName="active" /> Attivo (visibile nel catalogo)</label>
          </p>
          <button type="submit" [disabled]="form.invalid">{{ saving() ? 'Salvataggio…' : 'Salva' }}</button>
        </fieldset>
      </form>
    }
    @if (error()) {
      <p class="error" role="alert">{{ error() }}</p>
    }
  `,
})
export class AdminProductFormPage implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly router = inject(Router);

  /** Parametro di rotta `:id`, assente in creazione. */
  readonly id = input<string>();

  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly form = inject(NonNullableFormBuilder).group({
    name: ['', Validators.required],
    description: [''],
    price: [0, [Validators.required, Validators.min(0.01)]],
    stock: [0, [Validators.required, Validators.min(0), Validators.pattern(/^\d+$/)]],
    category: [''],
    active: [true],
  });

  ngOnInit(): void {
    const id = this.id();
    if (!id) return;

    this.loading.set(true);
    this.admin.product(id).subscribe({
      next: (p) => {
        this.form.setValue({
          name: p.name,
          description: p.description ?? '',
          price: Number(p.price),
          stock: p.stock,
          category: p.category ?? '',
          active: p.active,
        });
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }

  save(): void {
    if (this.form.invalid) return;
    const id = this.id();
    const data = this.form.getRawValue();
    const request = id ? this.admin.updateProduct(id, data) : this.admin.createProduct(data);

    this.saving.set(true);
    this.error.set(null);
    request.subscribe({
      next: () => this.router.navigate(['/admin/products']),
      error: (err) => {
        this.error.set(errorMessage(err));
        this.saving.set(false);
      },
    });
  }
}
