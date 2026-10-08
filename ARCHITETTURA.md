# Architettura

Descrizione tecnica del progetto: componenti, modelli di dominio, autenticazione, flusso
principale e funzionalità avanzate. Per installazione e avvio vedi il [README](README.md).

## Indice

1. [Panoramica](#panoramica)
2. [Modelli di dominio](#modelli-di-dominio)
3. [Autenticazione JWT](#autenticazione-jwt)
4. [Backend](#backend)
5. [Frontend](#frontend)
6. [Flusso login → carrello → checkout → ordine](#flusso-login--carrello--checkout--ordine)
7. [Funzionalità avanzate](#funzionalità-avanzate)
8. [Test](#test)

## Panoramica

```
 Browser (localhost:4200)            Rails API (localhost:3000)           PostgreSQL 16
┌──────────────────────────┐  HTTP  ┌───────────────────────────┐  SQL  ┌──────────────┐
│ Angular 21 (SPA)         │  JSON  │ Rails 8.1 --api           │       │ users        │
│  pagine standalone       │ ─────► │  Devise + devise-jwt      │ ────► │ products     │
│  servizi con signal      │        │  controller REST          │       │ carts, items │
│  interceptor JWT/errori  │ ◄───── │  serializer → JSON        │ ◄──── │ orders, items│
│  guard sulle rotte       │  JWT   │  rescue_from → { error }  │       │ jwt_denylists│
└──────────────────────────┘        └───────────────────────────┘       └──────────────┘
```

- **Frontend:** single page application Angular. Non ha dati scritti nel codice: prodotti, carrello e
  ordini arrivano sempre dall'API.
- **Backend:** applicazione Rails in modalità API (niente viste né sessioni). Espone risorse REST,
  autentica con JWT e restituisce errori in un formato uniforme.
- **Database:** PostgreSQL; lo schema è in `backend/db/schema.rb`.
- **Ambiente:** `docker-compose.yml` avvia i tre servizi con il codice montato nei container.

## Modelli di dominio

```
User 1 ── 1 Cart 1 ── * CartItem * ── 1 Product
  │                                      │
  1                                      1
  │                                      │
  * Order 1 ── * OrderItem * ────────────┘
```

| Modello | Campi principali | Regole |
| --- | --- | --- |
| `User` | `email`, `encrypted_password`, `role` (`user` / `admin`) | email unica e password validate da Devise; ruolo di default `user` |
| `Product` | `name`, `description`, `price`, `stock`, `category`, `active` | prezzo > 0, stock intero ≥ 0 e scalato a ogni checkout; non eliminabile se compare in un carrello o in un ordine |
| `Cart` | `user_id` (unico) | un solo carrello per utente, creato al primo accesso; `total` è calcolato dalle righe |
| `CartItem` | `cart_id`, `product_id`, `quantity`, `unit_price` | quantità intera > 0; un prodotto compare una sola volta per carrello |
| `Order` | `full_name`, `email`, `address`, `city`, `postal_code`, `total`, `status` | dati di spedizione obbligatori; nasce `pending`, l'enum prevede anche `paid`, `shipped`, `cancelled` (usati dal filtro dello storico) |
| `OrderItem` | `order_id`, `product_id`, `quantity`, `unit_price` | copia della riga di carrello al momento dell'ordine |
| `JwtDenylist` | `jti`, `exp` | identificativi dei token revocati al logout |

Scelte di modellazione:

- **Il carrello è salvato sul database**, non nel browser: sopravvive al logout, al cambio di
  dispositivo e al reload della pagina.
- **I prezzi vengono congelati.** `CartItem.unit_price` è il prezzo del prodotto quando è stato
  aggiunto, e `OrderItem.unit_price` lo copia al checkout: se l'admin cambia il prezzo di un prodotto,
  gli ordini già fatti non cambiano. Anche `Order.total` è salvato, non ricalcolato.
- **I prodotti si disattivano invece di cancellarli.** `active: false` li toglie dal catalogo
  pubblico senza rompere i riferimenti da carrelli e ordini (`dependent: :restrict_with_error`).
- **Le cancellazioni a cascata partono dall'utente:** eliminarlo elimina carrello, righe e ordini.
- Importi in `decimal(10,2)`, mai in virgola mobile.

## Autenticazione JWT

_In preparazione._

## Backend

_In preparazione._

## Frontend

_In preparazione._

## Flusso login → carrello → checkout → ordine

_In preparazione._

## Funzionalità avanzate

_In preparazione._

## Test

_In preparazione._
