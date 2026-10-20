module Auth
  class MeController < ApplicationController
    def show
      # Se il token JWT è valido, restituisce i dati dell'utente loggato.
      # altrimenti restituisce un errore 401 Unauthorized.(per esempio se il token è scaduto o non valido)
      render json: { user: UserSerializer.call(current_user) }
    end
  end
end
