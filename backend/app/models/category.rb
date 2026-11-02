class Category < ApplicationRecord
  DEFAULT_NAME = "non-categorized".freeze

  # Un prodotto non può restare senza categoria: all'eliminazione passa a quella di default
  # (equivalente di ON DELETE SET DEFAULT). L'update è ON UPDATE CASCADE a livello di FK.
  has_many :products, dependent: nil

  validates :name, presence: true, uniqueness: { case_sensitive: false }
  validate :default_category_is_locked, on: :update
  before_destroy :reassign_products_to_default, prepend: true

  scope :alphabetical, -> { order(:name) }

  def self.default
    find_or_create_by!(name: DEFAULT_NAME)
  end

  def default?
    name_in_database == DEFAULT_NAME
  end

  private

  def default_category_is_locked
    errors.add(:name, "della categoria di default non modificabile") if default? && name_changed?
  end

  def reassign_products_to_default
    if default?
      errors.add(:base, "La categoria di default non può essere eliminata")
      throw :abort
    end

    products.update_all(category_id: Category.default.id)
  end
end
