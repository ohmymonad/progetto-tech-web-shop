import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { errorMessage } from '../../core/http-error';
import { User } from '../../core/models';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-admin-user-detail',
  imports: [RouterLink, DatePipe],
  template: `
    <p><a routerLink="/admin/users">← Utenti</a></p>
    @if (loading()) {
      <p>Caricamento…</p>
    } @else if (error()) {
      <p class="error" role="alert">{{ error() }} <button type="button" (click)="load()">Riprova</button></p>
    } @else if (user(); as u) {
      <h2>Utente #{{ u.id }}</h2>
      <dl>
        <dt>Email</dt><dd>{{ u.email }}</dd>
        <dt>Ruolo</dt><dd>{{ u.role }}</dd>
        <dt>Registrato il</dt><dd>{{ u.created_at | date: 'dd/MM/yyyy HH:mm' }}</dd>
      </dl>
    }
  `,
})
export class AdminUserDetailPage implements OnInit {
  private readonly admin = inject(AdminService);

  /** Parametro di rotta `:id`. */
  readonly id = input.required<string>();

  protected readonly user = signal<User | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.admin.user(this.id()).subscribe({
      next: (user) => {
        this.user.set(user);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }
}
