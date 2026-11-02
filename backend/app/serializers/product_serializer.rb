#serializer per i prodotti, usato in ProductsController#index e ProductsController#show
class ProductSerializer
  def self.call(product)
    {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      category_id: product.category_id,
      category: product.category.name,
      active: product.active
    }
  end
end
