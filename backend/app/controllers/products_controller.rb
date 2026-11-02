class ProductsController < ApplicationController
  DEFAULT_PER_PAGE = 20
  MAX_PER_PAGE = 100

  def index

    ## tag e q sono parametri della query string, per esempio /products?tag=foo&q=bar
    scope = Product.active.by_category(params[:tag]).search(params[:q]).order(:id)
    ## page e per_page sono parametri della query string, per esempio /products?page=2&per_page=10

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
    # .active e' uno scope definito nel model Product che filtra solo i prodotti attivi
    # .pluck estrae una colonna come array invece che come array di oggetti ActiveRecord
    render json: { categories: Product.active.where.not(category: [nil, ""]).distinct.order(:category).pluck(:category) }

  end

  def show
    render json: { product: ProductSerializer.call(Product.find(params[:id])) }
  end
end
