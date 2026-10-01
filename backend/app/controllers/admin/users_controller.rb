module Admin
  class UsersController < ApplicationController
    include Admin::Authorization

    def index
      render json: { users: User.order(:id).map { |u| UserSerializer.call(u) } }
    end

    def show
      render json: { user: UserSerializer.call(User.find(params[:id])) }
    end

    def destroy
      user = User.find(params[:id])
      raise InvalidRequest, "Non puoi eliminare il tuo stesso account" if user == current_user

      user.destroy!
      render json: { message: "Utente eliminato" }
    end
  end
end
