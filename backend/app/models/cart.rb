class Cart < ApplicationRecord
  belongs_to :user
  has_many :cart_items, dependent: :destroy

  def total
    cart_items.sum { |item| item.quantity * item.unit_price }
  end
end
