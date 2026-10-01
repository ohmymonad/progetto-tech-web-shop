import { HttpErrorResponse } from '@angular/common/http';

const FALLBACK: Record<number, string> = {
  0: 'Server non raggiungibile: controlla la connessione e riprova',
  400: 'Richiesta non valida',
  401: 'Sessione scaduta: effettua di nuovo il login',
  403: 'Operazione non consentita',
  404: 'Risorsa non trovata',
  422: 'Dati non validi',
  500: 'Errore interno del server',
};

/** Messaggio leggibile da qualsiasi errore: usa `{ error }` del backend se presente. */
export function errorMessage(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    const body: unknown = err.error;
    if (body && typeof body === 'object' && 'error' in body && typeof body.error === 'string') {
      return body.error;
    }
    return FALLBACK[err.status] ?? `Errore inatteso (HTTP ${err.status})`;
  }
  return err instanceof Error ? err.message : 'Errore inatteso';
}
