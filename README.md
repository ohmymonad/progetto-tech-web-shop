# Shop — Rails API + Angular

E-commerce minimale realizzato per il corso di Tecnologie di Sviluppo Web: catalogo prodotti,
carrello persistente, checkout con creazione dell'ordine e autenticazione JWT. Backend Rails 8 in
modalità API, frontend Angular 21, database PostgreSQL, il tutto avviabile con Docker Compose.

## Struttura del repository

```
/
├── docker-compose.yml   # db + backend + frontend, con il codice montato nei container
├── .env.example         # variabili d'ambiente di esempio (da copiare in .env)
├── README.md            # questo file
├── backend/             # Rails 8.1 --api (Devise + devise-jwt, RSpec)
└── frontend/            # Angular 21 (standalone, signal, Vitest)
```

## Indice

1. [Prerequisiti](#prerequisiti)
2. [Configurazione](#configurazione)
3. [Avvio rapido con Docker Compose](#avvio-rapido-con-docker-compose)
4. [Database: migrazioni e seed](#database-migrazioni-e-seed)
5. [Avvio nativo del backend](#avvio-nativo-del-backend)
6. [Frontend in sviluppo](#frontend-in-sviluppo)
7. [Build di produzione del frontend](#build-di-produzione-del-frontend)
8. [Utenti di test](#utenti-di-test)
9. [Test](#test)
10. [API](#api)
11. [Problemi noti](#problemi-noti)

## Prerequisiti

**Percorso consigliato (Docker):** basta Docker con il plugin Compose v2. Ruby, Node e PostgreSQL
girano nei container.

| Software | Versione verificata | Dove |
| --- | --- | --- |
| Docker Engine | 29.8 | host |
| Docker Compose | v2.40 | host |
| Ruby | 3.4.7 | immagine `ruby:3.4.7-slim` (`backend/.ruby-version`) |
| Rails | 8.1.3 | `backend/Gemfile.lock` |
| PostgreSQL | 16.14 | immagine `postgres:16-alpine` |
| Node.js | 22.23 (npm 10.9) | immagine `node:22-alpine` |
| Angular CLI | 21.2 | installata nell'immagine del frontend |

Gem principali: `devise` 5.0.4, `devise-jwt` 0.13.0, `rack-cors` 3.0.0, `rspec-rails` 8.0.4.
Pacchetti principali: `@angular/core` 21.2, `typescript` 5.9, `vitest` 4.1.

**Percorso nativo (senza Docker):** servono le stesse versioni installate sulla macchina
(Ruby 3.4.7 con Bundler, Node.js 22 con npm, PostgreSQL 16, Angular CLI 21 opzionale perché si
può usare `npx ng`) e le librerie di sviluppo di PostgreSQL (`libpq-dev`) per compilare la gem `pg`.

## Configurazione

### Variabili d'ambiente

```bash
cp .env.example .env
```

`.env` è letto da Docker Compose ed è ignorato da git. Tutte le variabili hanno un valore di
default in `docker-compose.yml`, quindi il file è facoltativo: serve solo per cambiare i valori.

| Variabile | Default | Uso |
| --- | --- | --- |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` | `shop` / `shop_password` | utente del database |
| `POSTGRES_DB` | `shop_development` | database di sviluppo |
| `POSTGRES_HOST` / `POSTGRES_PORT` | `db` / `5432` | dove il backend trova Postgres (`localhost` fuori da Docker) |

### Segreti: encrypted credentials di Rails

Nessun segreto è scritto in chiaro in `.env` o nel codice. I segreti stanno in
`backend/config/credentials.yml.enc`, che è cifrato e committato; la chiave per decifrarlo è
`backend/config/master.key`, che **non** è committata.

- **Sviluppo e test:** `master.key` non serve. Rails genera da solo una chiave locale
  (`backend/tmp/local_secret.txt`) e la usa per firmare i JWT.
- **Produzione:** serve `master.key` (oppure la variabile `RAILS_MASTER_KEY`), perché il segreto
  dei JWT è il `secret_key_base` delle credentials. Si può impostare un segreto dedicato
  aggiungendo la chiave `devise_jwt_secret_key` con `bin/rails credentials:edit` (richiede
  `master.key` e un editor nella variabile `EDITOR`); `config/initializers/devise.rb` la usa se presente.

## Avvio rapido con Docker Compose

```bash
docker compose up --build
```

Al primo avvio Compose costruisce le immagini, installa gem e pacchetti npm (conservati in volumi
dedicati) e avvia i tre servizi:

| Servizio | URL sull'host | Note |
| --- | --- | --- |
| `frontend` | <http://localhost:4200> | `ng serve` con ricarica automatica (`--poll 2000`) |
| `backend` | <http://localhost:3000> | Rails/Puma; `GET /up` è l'health check |
| `db` | `localhost:5433` | PostgreSQL 16 (porta 5433 per non scontrarsi con un Postgres locale) |

L'entrypoint del backend (`backend/bin/docker-entrypoint-dev`) aspetta che il database sia pronto
e lancia `bin/rails db:prepare`: al primo avvio crea il database, esegue le migrazioni e carica i
dati di esempio; agli avvii successivi applica solo le migrazioni nuove. Non serve quindi nessun
passo manuale per arrivare a un'applicazione funzionante.

Il codice di `backend/` e `frontend/` è montato nei container: le modifiche si vedono senza
ricostruire le immagini (serve `--build` solo se cambiano `Gemfile` o `package.json`).

```bash
docker compose down      # ferma i servizi, i dati restano nel volume pgdata
docker compose down -v   # ferma i servizi e cancella anche database e dipendenze installate
```

## Database: migrazioni e seed

Con Docker i comandi si eseguono nel container del backend:

```bash
docker compose run --rm backend bin/rails db:create    # crea il database (se non esiste)
docker compose run --rm backend bin/rails db:migrate   # applica le migrazioni
docker compose run --rm backend bin/rails db:seed      # carica i dati di esempio
docker compose run --rm backend bin/rails db:reset     # ricrea il database da zero e rilancia il seed
```

Senza Docker sono gli stessi comandi lanciati dalla cartella `backend/` (`bin/rails db:migrate`, ...).

Il seed (`backend/db/seeds.rb`) è idempotente, quindi si può rilanciare senza creare duplicati, e carica:

- **20 prodotti** in 5 categorie (Elettronica, Casa, Sport, Libri, Abbigliamento), tutti attivi e
  con disponibilità a magazzino;
- **2 utenti**, un amministratore e un cliente: vedi [Utenti di test](#utenti-di-test).

Lo schema risultante è in `backend/db/schema.rb`.

## Avvio nativo del backend

Alternativa a Docker per il solo backend (il percorso verificato resta quello con Compose).
Serve un PostgreSQL raggiungibile: va bene uno installato localmente oppure solo il servizio `db`
di Compose (`docker compose up -d db`, esposto sulla porta **5433**).

```bash
cd backend
bundle install

# con il Postgres di Compose; per un Postgres locale ometti POSTGRES_PORT (default 5432)
export POSTGRES_HOST=localhost POSTGRES_PORT=5433
export POSTGRES_USER=shop POSTGRES_PASSWORD=shop_password

bin/rails db:prepare   # crea, migra e (alla creazione) popola il database
bin/rails server       # http://localhost:3000
```

`backend/config/database.yml` legge le variabili `POSTGRES_*` con gli stessi default di
`.env.example`, tranne `POSTGRES_HOST` che fuori da Docker vale `localhost`. Il database dei test
si chiama `backend_test`.

## Frontend in sviluppo

Con Docker il server di sviluppo parte già con `docker compose up`. Senza Docker:

```bash
cd frontend
npm ci
npm start              # equivale a: npx ng serve → http://localhost:4200
```

L'app chiama il backend su `http://localhost:3000`. L'indirizzo è definito dal token `API_URL`
in `frontend/src/app/core/api.config.ts`: per puntare a un altro backend si cambia il valore
lì. Il backend accetta richieste cross-origin solo da `localhost:4200` e `127.0.0.1:4200`
(`backend/config/initializers/cors.rb`), quindi il frontend va servito su quella porta.

## Build di produzione del frontend

```bash
# con Docker (il servizio frontend in esecuzione va prima fermato, perché usa la porta 4200)
docker compose stop frontend
docker compose run --rm --no-deps frontend npx ng build
docker compose run --rm --no-deps -p 4200:4200 frontend npx --yes serve -s dist/frontend/browser -l 4200

# senza Docker, dalla cartella frontend/
npx ng build
npx --yes serve -s dist/frontend/browser -l 4200
```

`ng build` usa di default la configurazione `production` (minificazione, hashing dei file, budget
sulle dimensioni) e scrive i file statici in `frontend/dist/frontend/browser/`. Qualsiasi server
statico va bene, purché rimandi a `index.html` le rotte che non corrispondono a un file, così che
un link diretto come `/orders/1` arrivi al router di Angular: è ciò che fa l'opzione `-s` di
`serve`. Il backend deve essere attivo su `localhost:3000`.

## Utenti di test

Creati dal seed (vedi [Database: migrazioni e seed](#database-migrazioni-e-seed)):

| Ruolo | Email | Password | Cosa può fare |
| --- | --- | --- | --- |
| Amministratore | `admin@example.com` | `password123` | tutto ciò che fa un cliente, più l'area `/admin` (prodotti e utenti) |
| Cliente | `user@example.com` | `password123` | catalogo, carrello, checkout, storico ordini |

Dalla pagina di registrazione si possono creare altri clienti; il ruolo di amministratore non è
assegnabile dal frontend né dall'API pubblica.

## Test

_In preparazione._

## API

_In preparazione._

## Problemi noti

_In preparazione._
