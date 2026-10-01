import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `
    <h2>Pagina non trovata</h2>
    <p><a routerLink="/">Torna alla home</a></p>
  `,
})
export class NotFoundPage {}
