module Admin
  class ProductsController < ApplicationController
    include Admin::Authorization

    before_action :set_product, only: %i[show update destroy]

    def index
      render json: { products: Product.includes(:category).order(:id).map { |p| ProductSerializer.call(p) } }
    end

    def show
      render json: { product: ProductSerializer.call(@product) }
    end

    def create
      product = Product.create!(product_params)
      render json: { product: ProductSerializer.call(product) }, status: :created
    end

    def update
      @product.update!(product_params)
      render json: { product: ProductSerializer.call(@product) }
    end

    def destroy
      unless @product.destroy
        raise InvalidRequest, @product.errors.full_messages.to_sentence.presence || "Prodotto non eliminabile"
      end

      render json: { message: "Prodotto eliminato" }
    end

    private

    def set_product
      @product = Product.find(params[:id])
    end

    def product_params
      params.require(:product).permit(:name, :description, :price, :stock, :category_id, :active)
    end
  end
end
