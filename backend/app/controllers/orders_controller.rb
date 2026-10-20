class OrdersController < ApplicationController
  def index
    orders = current_user.orders.includes(order_items: :product).order(created_at: :desc, id: :desc)
    orders = filter_by_status(orders)
    orders = filter_by_dates(orders)
    render json: { orders: orders.map { |o| OrderSerializer.call(o) } }
  end

  def show
    order = current_user.orders.includes(order_items: :product).find(params[:id])
    render json: { order: OrderSerializer.call(order) }
  end

  # Trasforma il carrello in ordine: stock scalato, prezzi congelati, totale calcolato, carrello svuotato.
  # Qualsiasi errore annulla l'intera transazione, stock compreso.
  def create
    cart = current_cart #definito in ApplicationController
    raise InvalidRequest, "Il carrello è vuoto" if cart.cart_items.empty?

    order = nil
    ActiveRecord::Base.transaction do
      items = cart.cart_items.to_a
      products = withdraw_stock!(items)

      order = current_user.orders.build(customer_params)
      order.total = cart.total
      items.each do |item|
        order.order_items.build(product: products[item.product_id], quantity: item.quantity, unit_price: item.unit_price)
      end
      order.save!
      cart.cart_items.destroy_all
    end

    render json: { order: OrderSerializer.call(order) }, status: :created
  end

  private

  # Blocca le righe dei prodotti (SELECT ... FOR UPDATE, in ordine di id per evitare deadlock):
  # due checkout concorrenti non possono vendere la stessa disponibilità.
  def withdraw_stock!(items)
    products = Product.where(id: items.map(&:product_id)).order(:id).lock.index_by(&:id)
    items.each do |item|
      product = products.fetch(item.product_id)
      if product.stock < item.quantity
        raise InvalidRequest,
              "Disponibilità insufficiente per #{product.name}: richiesti #{item.quantity}, disponibili #{product.stock}"
      end

      product.update!(stock: product.stock - item.quantity)
    end
    products
  end

  def customer_params
    params.require(:order).permit(:full_name, :email, :address, :city, :postal_code)
  end

  def filter_by_status(scope)
    return scope if params[:status].blank?
    raise InvalidRequest, "Stato non valido" unless Order.statuses.key?(params[:status])

    scope.where(status: params[:status])
  end

  def filter_by_dates(scope)
    scope = scope.where(created_at: parse_date(params[:from]).beginning_of_day..) if params[:from].present?
    scope = scope.where(created_at: ..parse_date(params[:to]).end_of_day) if params[:to].present?
    scope
  end

  def parse_date(value)
    Date.iso8601(value.to_s).in_time_zone
  rescue ArgumentError
    raise InvalidRequest, "Data non valida (formato atteso: AAAA-MM-GG)"
  end
end
