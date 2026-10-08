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

L'autenticazione usa **Devise** (gestione utenti e password con bcrypt) più **devise-jwt** (token
stateless). Non esistono sessioni né cookie: ogni richiesta porta con sé il proprio token.

1. **Emissione.** `POST /auth/login` e `POST /auth/signup` sono le sole `dispatch_requests`
   configurate in `backend/config/initializers/devise.rb`. Se il controller autentica l'utente
   (`sign_in(user, store: false)`), il middleware di devise-jwt aggiunge alla risposta l'header
   `Authorization: Bearer <jwt>`. Il token è firmato con HS256 e contiene l'id dell'utente, un
   `jti` univoco e la scadenza (24 ore).
2. **Uso.** Il client rimanda l'header a ogni richiesta. `ApplicationController` ha
   `before_action :authenticate_user!` come default, quindi ogni endpoint è protetto salvo quelli
   che lo escludono esplicitamente (login e signup). Token assente, scaduto o con firma non valida → `401`.
3. **Revoca.** `DELETE /auth/logout` è la `revocation_request`: il middleware salva il `jti` del token
   nella tabella `jwt_denylists` (strategia `Denylist`, modello `JwtDenylist`). Da quel momento lo
   stesso token, anche se non ancora scaduto, viene rifiutato con `401`.
4. **Ruoli.** `User.role` è un enum `user` / `admin`. Il ruolo non è tra i parametri accettati dalla
   registrazione, quindi un client non può assegnarselo. I controller sotto `/admin` includono il
   concern `Admin::Authorization`, che risponde `403` a chi non è admin.

Il CORS (`backend/config/initializers/cors.rb`) espone l'header `Authorization`: senza questa
configurazione il browser non permetterebbe al frontend di leggerlo.

## Backend

```
backend/app/
├── controllers/
│   ├── application_controller.rb   # autenticazione di default + gestione centralizzata degli errori
│   ├── auth/                       # sessions (login/logout), registrations (signup), me
│   ├── products_controller.rb      # catalogo pubblico (solo prodotti attivi)
│   ├── carts_controller.rb         # GET /cart
│   ├── cart_items_controller.rb    # righe del carrello
│   ├── orders_controller.rb        # storico, dettaglio, checkout
│   ├── admin/                      # products (CRUD), users (lista, dettaglio, eliminazione)
│   └── concerns/admin/authorization.rb
├── models/                         # vedi "Modelli di dominio"
└── serializers/                    # ProductSerializer, CartSerializer, OrderSerializer, UserSerializer
```

- **Controller sottili.** Le query stanno nei model (scope `Product.active`, `by_category`, `search`),
  la forma del JSON nei serializer: ogni risposta è un oggetto con una chiave radice
  (`{ product: … }`, `{ products: […], meta: {…} }`, `{ cart: … }`).
- **Errori uniformi.** `ApplicationController` intercetta le eccezioni con `rescue_from` e risponde
  sempre `{ "error": "messaggio" }`: `RecordNotFound` → 404, `RecordInvalid` → 422 con i messaggi di
  validazione, `ParameterMissing` → 400, `NotAuthorized` → 403, `InvalidRequest` → 422, qualsiasi
  altra eccezione → 500 (registrata nel log). I controller sollevano eccezioni invece di comporre a
  mano le risposte d'errore.
- **Accesso ai dati dell'utente.** Gli ordini si cercano sempre a partire da `current_user.orders`, quindi
  l'ordine di un altro utente risulta inesistente (404). Le righe di carrello controllano il
  proprietario e rispondono 403.
- **Parametri.** Strong parameters ovunque; quantità e date sono validate esplicitamente (intero
  in base 10, data ISO `AAAA-MM-GG`), così che un valore malformato dia 422 e non 500.
- **Checkout transazionale con scalaggio del magazzino.** `OrdersController#create` fa tutto
  dentro un'unica `ActiveRecord::Base.transaction`, quindi o riesce tutto o non cambia niente:
  1. blocca i prodotti del carrello con `SELECT … FOR UPDATE`, in ordine di id per evitare deadlock;
  2. verifica che lo `stock` basti per ogni riga e lo scala;
  3. crea ordine e righe;
  4. svuota il carrello.

  Se anche un solo prodotto non ha disponibilità sufficiente, risponde 422 indicando il prodotto, e
  stock, carrello e ordini restano come prima. Il lock impedisce a due checkout concorrenti di
  vendere la stessa unità.

## Frontend

```
frontend/src/app/
├── app.config.ts        # HttpClient + interceptor, router, ripristino della sessione all'avvio
├── app.routes.ts        # rotte lazy con guard
├── core/
│   ├── api.config.ts    # token API_URL (http://localhost:3000)
│   ├── auth.service.ts  # login, signup, logout, utente corrente
│   ├── auth.interceptor.ts
│   ├── error.interceptor.ts
│   ├── http-error.ts    # errorMessage(): messaggio leggibile da qualsiasi errore HTTP
│   ├── auth.guards.ts   # authGuard, adminGuard, guestGuard
│   └── models.ts        # tipi delle risposte dell'API
├── services/            # ProductService, CartService, OrderService, AdminService
└── pages/               # componenti standalone, uno per pagina
```

- **Angular 21 zoneless, stato in signal.** Componenti standalone; lo stato condiviso vive nei servizi
  come `signal` (privati in scrittura, esposti in sola lettura), con valori derivati tramite
  `computed` (`isLoggedIn`, `isAdmin`, `itemCount`).
- **Servizi con una responsabilità ciascuno.** Ogni chiamata HTTP passa da un servizio; le pagine
  non usano `HttpClient` direttamente e nessun dato di prodotti, carrello o ordini è scritto nel codice.
  - `AuthService`: legge il JWT dall'header `Authorization` delle risposte di login e signup, lo
    salva in `localStorage` (chiave `shop.jwt`) ed espone `currentUser`. All'avvio,
    `provideAppInitializer` chiama `GET /auth/me` per ripristinare la sessione prima della prima
    navigazione, così le guard sanno già chi è l'utente.
  - `CartService`: specchio del carrello sul backend. Un `effect` su `currentUser` lo carica al
    login e lo azzera al logout. Dopo ogni modifica adotta il carrello restituito dal server; se la
    modifica fallisce, rilegge `GET /cart` per riallinearsi.
  - `ProductService`, `OrderService`, `AdminService`: traducono filtri e form in query string e
    corpi delle richieste, ed estraggono la chiave radice della risposta.
- **Interceptor.**
  - `authInterceptor` aggiunge `Authorization: Bearer <jwt>` solo alle richieste dirette ad `API_URL`,
    così il token non viene mai inviato ad altri domini.
  - `errorInterceptor`: un `401` su qualsiasi endpoint diverso da login e signup significa token scaduto o
    revocato. In quel caso chiude la sessione e porta a `/login?returnUrl=<pagina corrente>`.
- **Stato delle richieste nelle pagine.** Le pagine tengono `loading` / `error` in signal (il
  carrello usa quelli di `CartService`) e mostrano il messaggio ottenuto da `errorMessage()`: il campo `error` del backend se c'è, altrimenti un
  messaggio di riserva per codice HTTP (0 = server non raggiungibile).
- **Rotte e guard.** Tutte le pagine sono caricate lazy (`loadComponent`).
  - `guestGuard`: login e registrazione, solo per chi non è autenticato.
  - `authGuard`: catalogo, carrello, checkout, ordini.
  - `adminGuard`: sezione `/admin`.

  Le guard servono a evitare navigazioni inutili: il controllo vero dei permessi lo fa il backend.

## Flusso login → carrello → checkout → ordine

1. **Login.** La pagina `/login` (reactive form) chiama `AuthService.login()` →
   `POST /auth/login`. Il backend verifica le credenziali e devise-jwt aggiunge
   `Authorization: Bearer <jwt>` alla risposta. Il frontend salva il token, imposta `currentUser` e
   torna alla pagina di partenza (`returnUrl`) oppure alla home (catalogo).
2. **Caricamento del carrello.** Il cambio di `currentUser` attiva l'`effect` di `CartService`, che
   chiama `GET /cart`. Il backend restituisce il carrello dell'utente, creandolo se non esiste,
   con righe e totale. Il contatore nella barra di navigazione si aggiorna da solo (`itemCount`).
3. **Catalogo e aggiunta.** `/products` chiama `GET /products?category=&q=&page=`. "Aggiungi al
   carrello" chiama `POST /cart/items { product_id, quantity }`. Il backend crea la riga con il
   prezzo corrente del prodotto (o somma la quantità se la riga esiste già) e restituisce il carrello
   aggiornato, che il frontend adotta così com'è.
4. **Carrello.** In `/cart` si cambiano le quantità (`PATCH /cart/items/:id`) o si rimuovono righe
   (`DELETE /cart/items/:id`). Ogni risposta contiene il carrello completo, quindi i totali li calcola
   sempre il backend.
5. **Checkout.** `/checkout` è un reactive form con validatori: tutti i campi obbligatori, email valida,
   CAP di 5 cifre. Finché il form non è valido non si invia nulla e gli errori compaiono sotto i campi.
   All'invio la pagina passa allo stato `loading` e chiama `POST /orders { order: { full_name, email,
   address, city, postal_code } }`.
6. **Creazione dell'ordine (backend).** In una sola transazione:
   - rifiuta un carrello vuoto (422);
   - blocca i prodotti del carrello e ne scala lo `stock`. Se un prodotto non ha abbastanza unità
     risponde 422 con il nome del prodotto, e la transazione annullata lascia tutto com'era;
   - crea l'`Order` con il totale del carrello;
   - copia ogni `CartItem` in un `OrderItem` con il suo `unit_price`;
   - svuota il carrello.

   Risponde `201` con l'ordine completo.
7. **Conferma.** Il frontend mostra il numero d'ordine con il link al dettaglio e ricarica il carrello,
   ora vuoto. In caso di errore la pagina mostra il messaggio del backend e permette di riprovare
   senza perdere i dati inseriti.
8. **Storico.** `/orders` elenca gli ordini (`GET /orders`) e `/orders/:id` ne mostra il dettaglio
   (vedi [Funzionalità avanzate](#funzionalità-avanzate)).

Il token resta valido per i giri successivi. Il logout (`DELETE /auth/logout`) lo revoca sul
backend, svuota lo stato locale e, tramite lo stesso `effect`, azzera il carrello mostrato.

## Funzionalità avanzate

Sono implementate **entrambe** le funzionalità avanzate proposte dalla traccia: la seconda conta
come bonus.

### 1. Area Admin per prodotti (con gestione utenti)

- **Backend:** namespace `/admin`. `Admin::ProductsController` offre il CRUD completo dei prodotti,
  inclusi quelli non attivi. `Admin::UsersController` offre lista, dettaglio ed eliminazione degli
  utenti; un admin non può eliminare il proprio account. Entrambi includono il concern
  `Admin::Authorization` (`before_action :require_admin!`), che risponde `403` a chi non è admin,
  qualunque cosa faccia il frontend.
- **Frontend:** sezione `/admin` protetta da `adminGuard` (un utente non admin viene rimandato alla
  home), servita da `AdminService`. Contiene:
  - lista dei prodotti;
  - form di creazione e modifica (lo stesso componente su `/admin/products/new` e `/admin/products/:id/edit`);
  - eliminazione con conferma;
  - lista e dettaglio degli utenti con eliminazione.

  Il link "Admin" nella barra compare solo se `isAdmin()`.
- **Eliminare un prodotto già ordinato** non è permesso: il model risponde con un errore di
  validazione, mostrato come messaggio. Per toglierlo dal catalogo lo si disattiva (`active`).

### 2. Storico ordini avanzato

- **Backend:** `GET /orders` restituisce solo gli ordini dell'utente, dal più recente, con
  filtri combinabili:
  - `status` (uno degli stati dell'enum, altrimenti 422);
  - `from` e `to` (date `AAAA-MM-GG`, inclusive: da inizio giornata a fine giornata).

  `GET /orders/:id` restituisce l'ordine con righe, prodotti, prezzi congelati e indirizzo.
- **Frontend:** la pagina "I miei ordini" (`/orders`) ha un form di filtro per stato e
  intervallo di date. `OrderService` invia solo i filtri valorizzati. Il dettaglio (`/orders/:id`)
  mostra:
  - stato e data;
  - destinatario e indirizzo di spedizione;
  - una tabella con prodotto, prezzo al momento dell'ordine, quantità e subtotale;
  - il totale.

## Test

_In preparazione._
