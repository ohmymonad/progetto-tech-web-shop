module Admin
  module Authorization
    extend ActiveSupport::Concern

    included do
      before_action :require_admin!
    end

    private

    def require_admin!
      raise ApplicationController::NotAuthorized, "Area riservata agli amministratori" unless current_user.admin?
    end
  end
end
