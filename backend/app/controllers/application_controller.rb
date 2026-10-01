class ApplicationController < ActionController::API
  class NotAuthorized < StandardError; end
  class InvalidRequest < StandardError; end

  # Default "protetto": le eccezioni si dichiarano con skip_before_action.
  before_action :authenticate_user!

  # L'ordine conta: gli handler dichiarati per ultimi hanno la precedenza.
  rescue_from StandardError do |e|
    Rails.logger.error("#{e.class}: #{e.message}\n#{e.backtrace&.first(10)&.join("\n")}")
    render_error("Errore interno del server", :internal_server_error)
  end
  rescue_from ActionController::ParameterMissing do |e|
    render_error(e.message, :bad_request)
  end
  rescue_from ActiveRecord::RecordNotFound do |e|
    render_error("Risorsa non trovata: #{e.model}", :not_found)
  end
  rescue_from ActiveRecord::RecordInvalid do |e|
    render_error(e.record.errors.full_messages.to_sentence, :unprocessable_content)
  end
  rescue_from InvalidRequest do |e|
    render_error(e.message, :unprocessable_content)
  end
  rescue_from NotAuthorized do |e|
    render_error(e.message.presence || "Operazione non consentita", :forbidden)
  end

  private

  def render_error(message, status)
    render json: { error: message }, status: status
  end

  def current_cart
    @current_cart ||= current_user.cart || current_user.create_cart!
  end
end
