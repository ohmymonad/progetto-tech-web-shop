class CartSerializer
  def self.call(cart)
    items = cart.cart_items.includes(:product).order(:id)
    {
      id: cart.id,
      total: cart.total.to_d,
      items: items.map do |item|
        {
          id: item.id,
          product_id: item.product_id,
          name: item.product.name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          subtotal: item.quantity * item.unit_price
        }
      end
    }
  end
end
