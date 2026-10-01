module Auth
  class SessionsController < ApplicationController
    skip_before_action :authenticate_user!, only: :create

    def create
      user = User.find_for_database_authentication(email: credentials[:email].to_s)
      if user&.valid_password?(credentials[:password].to_s)
        # store: false → nessuna sessione, solo JWT (emesso dal middleware di devise-jwt).
        sign_in(user, store: false)
        render json: { user: UserSerializer.call(user) }
      else
        render_error("Email o password non valide", :unauthorized)
      end
    end

    # La revoca del token è fatta dal middleware di devise-jwt (denylist).
    def destroy
      render json: { message: "Logout effettuato" }
    end

    private

    def credentials
      params.require(:user).permit(:email, :password)
    end
  end
end
