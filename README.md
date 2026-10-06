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

_In preparazione._

## Avvio rapido con Docker Compose

_In preparazione._

## Database: migrazioni e seed

_In preparazione._

## Avvio nativo del backend

_In preparazione._

## Frontend in sviluppo

_In preparazione._

## Build di produzione del frontend

_In preparazione._

## Utenti di test

_In preparazione._

## Test

_In preparazione._

## API

_In preparazione._

## Problemi noti

_In preparazione._
