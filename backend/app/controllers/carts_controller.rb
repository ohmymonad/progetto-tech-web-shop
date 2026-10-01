class CartsController < ApplicationController
  def show
    render json: { cart: CartSerializer.call(current_cart) }
  end
end
