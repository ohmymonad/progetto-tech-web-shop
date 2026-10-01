import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../core/auth.service';
import { errorMessage } from '../../core/http-error';
import { User } from '../../core/models';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-admin-users',
  imports: [RouterLink, DatePipe],
  template: `
    <h2>Admin · Utenti</h2>
    <p><a routerLink="/admin/products">Prodotti</a></p>

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
          <tr><th>#</th><th>Email</th><th>Ruolo</th><th>Registrato il</th><th></th></tr>
        </thead>
        <tbody>
          @for (u of users(); track u.id) {
            <tr>
              <td>{{ u.id }}</td>
              <td><a [routerLink]="['/admin/users', u.id]">{{ u.email }}</a></td>
              <td>{{ u.role }}</td>
              <td>{{ u.created_at | date: 'dd/MM/yyyy' }}</td>
              <td>
                @if (u.id !== currentUserId) {
                  <button type="button" (click)="remove(u)">Elimina</button>
                } @else {
                  <small>(tu)</small>
                }
              </td>
            </tr>
          }
        </tbody>
      </table>
    }
  `,
})
export class AdminUsersPage implements OnInit {
  private readonly admin = inject(AdminService);

  protected readonly currentUserId = inject(AuthService).currentUser()?.id;
  protected readonly users = signal<User[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly actionError = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.admin.users().subscribe({
      next: (users) => {
        this.users.set(users);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }

  remove(user: User): void {
    if (!confirm(`Eliminare l'utente ${user.email}? Verranno eliminati anche carrello e ordini.`)) return;
    this.actionError.set(null);
    this.admin.deleteUser(user.id).subscribe({
      next: () => this.users.update((list) => list.filter((u) => u.id !== user.id)),
      error: (err) => this.actionError.set(errorMessage(err)),
    });
  }
}
