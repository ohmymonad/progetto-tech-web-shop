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

_In preparazione._

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
