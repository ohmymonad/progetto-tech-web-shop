class CategorySerializer
  def self.call(category, products_count = nil)
    {
      id: category.id,
      name: category.name,
      default: category.default?,
      products_count: products_count
    }
  end
end
