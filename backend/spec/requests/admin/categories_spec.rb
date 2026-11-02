require "rails_helper"

RSpec.describe "Admin categorie", type: :request do
  let(:admin) { create(:admin) }

  describe "GET /admin/categories" do
    def send_request(h) = get("/admin/categories", headers: h)
    it_behaves_like "riservato agli admin"

    it "elenca le categorie con il numero di prodotti" do
      sport = create(:category, name: "sport")
      create_list(:product, 2, category: sport)
      get "/admin/categories", headers: auth_headers(admin)
      expect(response).to have_http_status(:ok)
      expect(json["categories"]).to include(a_hash_including("name" => "sport", "products_count" => 2))
    end
  end

  describe "PATCH /admin/categories/:id" do
    let!(:category) { create(:category, name: "sport") }
    def send_request(h) = patch("/admin/categories/#{category.id}", params: { category: { name: "x" } }, headers: h, as: :json)
    it_behaves_like "riservato agli admin"

    it "rinomina la categoria" do
      patch "/admin/categories/#{category.id}", params: { category: { name: "fitness" } }, headers: auth_headers(admin), as: :json
      expect(response).to have_http_status(:ok)
      expect(category.reload.name).to eq("fitness")
    end

    it "risponde 422 su categoria di default" do
      patch "/admin/categories/#{Category.default.id}", params: { category: { name: "x" } }, headers: auth_headers(admin), as: :json
      expect(response).to have_http_status(:unprocessable_content)
    end
  end

  describe "DELETE /admin/categories/:id" do
    let!(:category) { create(:category, name: "sport") }
    def send_request(h) = delete("/admin/categories/#{category.id}", headers: h)
    it_behaves_like "riservato agli admin"

    it "elimina e sposta i prodotti nella categoria di default" do
      product = create(:product, category: category)
      delete "/admin/categories/#{category.id}", headers: auth_headers(admin)
      expect(response).to have_http_status(:ok)
      expect(product.reload.category).to eq(Category.default)
    end

    it "non elimina la categoria di default" do
      delete "/admin/categories/#{Category.default.id}", headers: auth_headers(admin)
      expect(response).to have_http_status(:unprocessable_content)
    end
  end
end
