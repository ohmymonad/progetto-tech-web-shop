module Auth
  class MeController < ApplicationController
    def show
      render json: { user: UserSerializer.call(current_user) }
    end
  end
end
