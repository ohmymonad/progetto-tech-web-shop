class Order < ApplicationRecord
  belongs_to :user
  has_many :order_items, dependent: :destroy

  enum :status, { pending: 0, paid: 1, shipped: 2, cancelled: 3 }, default: :pending

  validates :full_name, :email, :address, :city, :postal_code, presence: true
  validates :total, numericality: { greater_than_or_equal_to: 0 }
end
