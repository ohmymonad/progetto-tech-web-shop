class CartItemsController < ApplicationController
  before_action :set_item, only: %i[update destroy]

  # Aggiungere un prodotto già presente incrementa la quantità.
  def create
    product = Product.active.find(params[:product_id])
    quantity = parse_quantity(params.fetch(:quantity, 1))
    raise InvalidRequest, "La quantità deve essere maggiore di zero" unless quantity.positive?

    item = current_cart.cart_items.find_or_initialize_by(product: product)
    if item.new_record?
      item.assign_attributes(quantity: quantity, unit_price: product.price)
    else
      item.quantity += quantity
    end
    item.save!

    render json: { cart: CartSerializer.call(current_cart) }, status: :created
  end

  def update
    @item.update!(quantity: parse_quantity(params[:quantity]))
    render json: { cart: CartSerializer.call(current_cart) }
  end

  def destroy
    @item.destroy!
    render json: { cart: CartSerializer.call(current_cart) }
  end

  private

  def set_item
    @item = CartItem.find(params[:id])
    raise NotAuthorized, "Questa riga non appartiene al tuo carrello" unless @item.cart.user_id == current_user.id
  end

  def parse_quantity(value)
    Integer(value.to_s, 10)
  rescue ArgumentError
    raise InvalidRequest, "Quantità non valida"
  end
end
