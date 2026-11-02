import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { errorMessage } from '../../core/http-error';
import { Category } from '../../core/models';
import { AdminService } from '../../services/admin.service';

/** Elenco, creazione, rinomina ed eliminazione delle categorie. "non-categorized" è protetta. */
@Component({
  selector: 'app-admin-categories',
  imports: [RouterLink, FormsModule],
  template: `
    <h2>Admin · Categorie</h2>
    <p><a routerLink="/admin/products">← Prodotti</a></p>

    <form (ngSubmit)="create()">
      <input name="newName" [(ngModel)]="newName" placeholder="Nuova categoria" aria-label="Nuova categoria" />
      <button type="submit" [disabled]="!newName.trim()">Aggiungi</button>
    </form>

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
          <tr><th>#</th><th>Nome</th><th>Prodotti</th><th></th></tr>
        </thead>
        <tbody>
          @for (c of categories(); track c.id) {
            <tr>
              <td>{{ c.id }}</td>
              <td>
                @if (editingId() === c.id) {
                  <input name="editName" [(ngModel)]="editName" aria-label="Nome categoria" />
                } @else {
                  {{ c.name }}
                }
              </td>
              <td>{{ c.products_count }}</td>
              <td>
                @if (c.default) {
                  <small>categoria di default</small>
                } @else if (editingId() === c.id) {
                  <button type="button" (click)="saveRename(c)">Salva</button>
                  <button type="button" (click)="editingId.set(null)">Annulla</button>
                } @else {
                  <button type="button" (click)="startRename(c)">Rinomina</button>
                  <button type="button" (click)="remove(c)">Elimina</button>
                }
              </td>
            </tr>
          }
        </tbody>
      </table>
    }
  `,
})
export class AdminCategoriesPage implements OnInit {
  private readonly admin = inject(AdminService);

  protected readonly categories = signal<Category[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly actionError = signal<string | null>(null);
  protected readonly editingId = signal<number | null>(null);
  protected newName = '';
  protected editName = '';

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.admin.categories().subscribe({
      next: (categories) => {
        this.categories.set(categories);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }

  create(): void {
    this.actionError.set(null);
    this.admin.createCategory(this.newName.trim()).subscribe({
      next: () => {
        this.newName = '';
        this.load();
      },
      error: (err) => this.actionError.set(errorMessage(err)),
    });
  }

  startRename(category: Category): void {
    this.editName = category.name;
    this.editingId.set(category.id);
  }

  saveRename(category: Category): void {
    this.actionError.set(null);
    this.admin.renameCategory(category.id, this.editName.trim()).subscribe({
      next: () => {
        this.editingId.set(null);
        this.load();
      },
      error: (err) => this.actionError.set(errorMessage(err)),
    });
  }

  remove(category: Category): void {
    if (!confirm(`Eliminare "${category.name}"? I suoi prodotti passeranno a "non-categorized".`)) return;
    this.actionError.set(null);
    this.admin.deleteCategory(category.id).subscribe({
      next: () => this.load(),
      error: (err) => this.actionError.set(errorMessage(err)),
    });
  }
}
