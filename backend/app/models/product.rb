class Product < ApplicationRecord
  belongs_to :category
  has_many :cart_items, dependent: :restrict_with_error
  has_many :order_items, dependent: :restrict_with_error

  before_validation { self.category ||= Category.default }

  validates :name, presence: true
  validates :price, presence: true, numericality: { greater_than: 0 }
  validates :stock, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  #scopes utilizzati per snellire le query nel controller ProductsController#index
  scope :active, -> { where(active: true) }

  # filtra per nome di categoria, con una join sulla tabella categories
  scope :by_category, ->(name) { name.present? ? joins(:category).where(categories: { name: name }) : all }
  #sperimentiamo un attimo con le lambdas per fare una ricerca full text sui prodotti
  scope :search, lambda { |term|
    ## se term è nil, stringa vuota o fatta solo di spazi, esci subito restituendo all
    next all if term.blank?

    #sanitiziamo 
    pattern = "%#{sanitize_sql_like(term)}%"
    where("products.name ILIKE :p OR products.description ILIKE :p", p: pattern)
  }

  def self.page(page = 1, per_page = 20)
    offset((page - 1) * per_page).limit(per_page)
  end
end
