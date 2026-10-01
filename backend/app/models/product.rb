class Product < ApplicationRecord
  has_many :cart_items, dependent: :restrict_with_error
  has_many :order_items, dependent: :restrict_with_error

  validates :name, presence: true
  validates :price, presence: true, numericality: { greater_than: 0 }
  validates :stock, numericality: { only_integer: true, greater_than_or_equal_to: 0 }

  scope :active, -> { where(active: true) }
  scope :by_category, ->(category) { category.present? ? where(category: category) : all }
  scope :search, lambda { |term|
    next all if term.blank?

    pattern = "%#{sanitize_sql_like(term)}%"
    where("products.name ILIKE :p OR products.description ILIKE :p", p: pattern)
  }

  def self.page(page = 1, per_page = 20)
    offset((page - 1) * per_page).limit(per_page)
  end
end
