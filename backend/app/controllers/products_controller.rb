class ProductsController < ApplicationController
  DEFAULT_PER_PAGE = 20
  MAX_PER_PAGE = 100

  def index
    scope = Product.active.includes(:category).by_category(params[:tag]).search(params[:q]).order(:id)
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

  # Nomi di tutte le categorie (tabella categories), per il menu a tendina del filtro.
  def categories
    # .alphabetical e' uno scope definito nel model Category che ordina per nome
    # .pluck estrae una colonna come array invece che come array di oggetti ActiveRecord
    render json: { categories: Category.alphabetical.pluck(:name) }
  end

  def show
    render json: { product: ProductSerializer.call(Product.find(params[:id])) }
  end
end
