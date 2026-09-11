# Progetto shop per corso di tecnologie di sviluppo web 
## Tecnologie 
- Frontend in Angular e Typescript 
- Backend: Ruby On Rails 
- Database: Postgres 
- Autenticazione e gestione delle sessioni: gestita lato server con Devise-jwt 
- CI/CD : docker-compose con container separati per frontend, backend e databse 

## Obbiettivo di progetto:
- creare uno shop, con carrello persistente tramite login
- un account admin in grado di eliminare ed ispezionare utenti 
- possibilita' di creare un utente tramite email e password con mailer
- ogni operazione CRUD su tutte le risorse dello shop solo tramite API REST, eseguibile 
	**SOLO ED ECLUSIVAMENTE** da utenti autenticati
- stato persistente sincronizzato fra backend e frontend (per esempio uscendo con elementi dentro il carrello, per un ordine ancora non eseguito,con logout o chiusura del browser, al ritorno(urche' il jwt di autenticazione sia ancora valido ovviamente), bisogna che il carrello sia salvato sul backend e il frontend mostri lo stesso carrello che l'utente aveva lasciato con i relativi prodotti )
- aspetti di gestione del codice: 
	- organizzazione del progetto, UX base e minima accessibilita'.
	- commit puliti e atomici, con test che passano 
	- scrivere i test rossi prima che venga implementata una API REST
- ogni API deve avere il check che il jwt di autenticazione sia ancora valido altrimenti buttare fuori l'utente e farlo riloggare
## Endpoints minimi 
### Gestione prodotti 
#### Backend
##### GET /products
* restituisce elenco prodotti;
* deve supportare almeno una di queste capacità:
* filtro per categoria/tag (es. ?tag=...) oppure
* ricerca testuale (es. ?q=...) oppure
* paginazione (?page=...&per_page=...).
#####  GET /products/:id
* restituisce il dettaglio del prodotto.
#### Frontend
- ProductService deve usare gli endpoint REST reali.
- Componenti di lista e dettaglio non devono più contenere dati hardcoded.
- È sufficiente una gestione basilare dei filtri/paginazione coerente con gli endpoint implementati.
### Carrello persistente
Obiettivo: il carrello deve essere memorizzato sul backend e ricaricabile.
####  Backend (Rails)
Modello dati minimo:
* Cart (associato all’utente, oppure legato a un token se si gestisce carrello guest);
* CartItem con riferimento a Product, quantità e prezzo unitario.
Endpoints minimi:
- GET /cart – restituisce lo stato del carrello corrente;
- POST /cart/items – aggiunge un nuovo prodotto (id + quantità);
- PATCH /cart/items/:id – aggiorna la quantità;
- DELETE /cart/items/:id – rimuove l’articolo dal carrello.
#### Frontend (Angular)
CartService deve:
* inizializzare lo stato leggendo /cart;
* aggiornare il backend a ogni modifica (aggiungi/modifica/rimuovi);
* aggiornare l’UI in maniera coerente.
* Il carrello deve sopravvivere almeno al reload della pagina (utente loggato).
* **Se lo studente implementa il carrello guest persistito, è considerato un plus.**
### Checkout e ordini 
La pagina di checkout deve essere basata sui reactive forms 
#### Backend
Modelli minimi:
- Order (dati cliente, totale, data creazione, stato ordine);
- OrderItem (riferimento a prodotto, quantità, prezzo al momento dell’ordine).
Endpoints minimi:
- POST /orders - crea un ordine a partire dal carrello associato all’utente e dai dati del form di checkout;
-  svuota o invalida il carrello dopo la creazione.
- GET /orders - restituisce la lista degli ordini dell’utente autenticato (anche senza filtri avanzati).
- GET /orders/:id - dettaglio di un singolo ordine.
#### Frontend
- OrderService deve inviare i dati di checkout a POST /orders.
	- L’utente deve ricevere un riscontro chiaro:
	* stato di loading durante la chiamata;
	* messaggio di conferma in caso di successo;
	* messaggio di errore in caso di fallimento, con eventuale possibilità di retry.
* **Una pagina semplice con la lista degli ordini (GET /orders) è obbligatoria** (dettaglio ordini più ricco può rientrare tra le funzionalità avanzate).
### Autenticazione 
#### Backend
Login con credenziali gestito da Rails
- implementazione con Devise 
* Endpoints minimi:
	* POST /auth/login – riceve credenziali e restituisce un token/jwt o session id;
	* POST /auth/logout;
	* GET /auth/me – restituisce dati utente corrente.●
Angular:
* pagina di login con form reale;
* memorizzazione token e attach via HttpInterceptor.
Integrazione nel flusso
- Solo utenti autenticati possono:
	* accedere alla pagina /checkout;
	* consultare la lista /orders;
	* utilizzare il carrello persistente associato all’utente.
**Angular deve usare almeno una route guard per proteggere le rotte riservate**.

## Requisiti tecnici 
### Backend 
* Progetto creato come API (rails new nome-progetto --api o configurazione equivalente).
* Database relazionale (preferibilmente PostgreSQL/MySQL o in alternativa Sqlite3).
* Validazioni di base sui modelli (campi obbligatori, formato email, valori numerici positivi, ecc.).
Gestione errori:
* uso coerente degli status HTTP (400, 401, 403, 404, 422, 500);
* risposta JSON che riporti almeno un messaggio di errore significativo.
Test minimo richiesto:
* almeno 1 test di modello (es. validazione Order o Product);
* almeno 1 test di request/controller per un endpoint significativo (es. POST /orders).
### Frontend 
- richiesta gestione state of the art dello stato HTTP(es. errori etc. )
Nessun uso di dati hardcoded per:
* prodotti
* carrello
* ordini.
Servizi dedicati:
-   ProductService, CartService, OrderService, AuthService (i nomi  possono variare, ma la responsabilità deve essere chiara).
* Uso di Reactive Forms per la pagina di checkout (come già visto a lezione).
* Uso di HttpClient e HttpInterceptor per:
	* token di autenticazione;
	* eventuale gestione centralizzata di errori HTTP.
## Funzionalita' avanzate(richieste)
Per calibrare il carico individuale:
* ogni studente deve realizzare almeno 1 funzionalità avanzata tra quelle elencate;
* Un'eventuale seconda funzionalità avanzata sarà considerata come bonus ai fini del voto.

### 1. Area Admin per prodotti
* Sezione riservata (protetta) per creare, modificare, cancellare prodotti.
* Protezione con ruolo admin lato backend e guard lato Angular.
### 2. Storico ordini avanzato
* Pagina “I miei ordini” con filtri per data/stato.
* Dettaglio ordine con tutte le informazioni (prodotti, quantità, prezzi, indirizzo)
## Consegna 
Ogni studente dovrà consegnare:
1. Repository Git (personale) contenente:
	* cartella backend/ con il progetto Rails;
	* cartella frontend/ con il progetto Angular.
2. README principale con:
	* prerequisiti software (versioni Ruby, Rails, Node, Angular CLI, DB, ecc.);
	* istruzioni passo-passo per:
		* configurare il database (migrazioni, seeding iniziale prodotti);
		* avviare il backend;
		* avviare il frontend in sviluppo e/o servire la build di produzione.
3. Breve documento (può essere un file ARCHITETTURA.md o sezione nel README) che descriva:
	* i principali modelli del dominio (Product, Cart, Order, User, ecc.);
	* il flusso login → carrello → checkout → ordine;
		* quali funzionalità avanzate sono state implementate.
4.  File docker-compose.yml per avviare velocemente l’ambiente completo.
