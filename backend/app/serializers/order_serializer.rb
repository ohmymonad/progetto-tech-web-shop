class OrderSerializer
  def self.call(order)
    {
      id: order.id,
      status: order.status,
      total: order.total,
      full_name: order.full_name,
      email: order.email,
      address: order.address,
      city: order.city,
      postal_code: order.postal_code,
      created_at: order.created_at,
      items: order.order_items.sort_by(&:id).map do |item|
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
