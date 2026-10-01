module Auth
  class RegistrationsController < ApplicationController
    skip_before_action :authenticate_user!, only: :create

    def create
      user = User.new(signup_params)
      user.save!
      sign_in(user, store: false)
      render json: { user: UserSerializer.call(user) }, status: :created
    end

    private

    # Il ruolo non è mai assegnabile dal client.
    def signup_params
      params.require(:user).permit(:email, :password)
    end
  end
end
