module Admin
  class CategoriesController < ApplicationController
    include Admin::Authorization

    before_action :set_category, only: %i[update destroy]

    def index
      counts = Product.group(:category_id).count
      categories = Category.alphabetical.map { |c| CategorySerializer.call(c, counts.fetch(c.id, 0)) }
      render json: { categories: categories }
    end

    def create
      category = Category.create!(category_params)
      render json: { category: CategorySerializer.call(category, 0) }, status: :created
    end

    def update
      @category.update!(category_params)
      render json: { category: CategorySerializer.call(@category, @category.products.count) }
    end

    def destroy
      unless @category.destroy
        raise InvalidRequest, @category.errors.full_messages.to_sentence.presence || "Categoria non eliminabile"
      end

      render json: { message: "Categoria eliminata" }
    end

    private

    def set_category
      @category = Category.find(params[:id])
    end

    def category_params
      params.require(:category).permit(:name)
    end
  end
end
