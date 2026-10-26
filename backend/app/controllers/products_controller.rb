class ProductsController < ApplicationController
  DEFAULT_PER_PAGE = 20
  MAX_PER_PAGE = 100

  def index
    scope = Product.active.by_category(params[:tag]).search(params[:q]).order(:id)
    page = [params.fetch(:page, 1).to_i, 1].max
    per_page = params.fetch(:per_page, DEFAULT_PER_PAGE).to_i.clamp(1, MAX_PER_PAGE)
    total = scope.count

    render json: {
      products: scope.page(page, per_page).map { |p| ProductSerializer.call(p) },
      meta: {
        page: page,
        per_page: per_page,
        total: total,
        total_pages: (total / per_page.to_f).ceil
      }
    }
  end

  # Categorie distinte dei prodotti attivi, per il menu a tendina del filtro.
  def categories
    render json: { categories: Product.active.where.not(category: [nil, ""]).distinct.order(:category).pluck(:category) }
  end

  def show
    render json: { product: ProductSerializer.call(Product.find(params[:id])) }
  end
end
