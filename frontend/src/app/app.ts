import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';

import { AuthService } from './core/auth.service';
import { CartService } from './services/cart.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink],
  templateUrl: './app.html',
})
export class App {
  protected readonly auth = inject(AuthService);
  /** Iniettato qui perché il carrello si sincronizzi dall'avvio dell'app. */
  protected readonly cart = inject(CartService);
  private readonly router = inject(Router);

  logout(): void {
    this.auth.logout().subscribe(() => this.router.navigate(['/login']));
  }
}
