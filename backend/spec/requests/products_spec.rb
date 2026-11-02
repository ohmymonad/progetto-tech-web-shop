require "rails_helper"

RSpec.describe "Prodotti", type: :request do
  let(:user) { create(:user) }
  let(:headers) { auth_headers(user) }

  describe "GET /products" do
    def send_request(h) = get("/products", headers: h)
    it_behaves_like "richiede autenticazione"

    it "elenca solo i prodotti attivi con meta di paginazione" do
      create_list(:product, 3)
      create(:product, active: false)
      get "/products", headers: headers
      expect(response).to have_http_status(:ok)
      expect(json["products"].size).to eq(3)
      expect(json["meta"]).to include("page" => 1, "total" => 3)
    end

    it "filtra per categoria con ?tag=" do
      create(:product, category: create(:category, name: "sport"))
      create(:product, category: create(:category, name: "casa"))
      get "/products", params: { tag: "sport" }, headers: headers
      expect(json["products"].map { |p| p["category"] }).to eq(["sport"])
    end

    it "cerca per nome con ?q=" do
      create(:product, name: "Lampada LED")
      create(:product, name: "Pallone")
      get "/products", params: { q: "lampada" }, headers: headers
      expect(json["products"].map { |p| p["name"] }).to eq(["Lampada LED"])
    end

    it "pagina con ?page= e ?per_page=" do
      create_list(:product, 5)
      get "/products", params: { page: 2, per_page: 2 }, headers: headers
      expect(json["products"].size).to eq(2)
      expect(json["meta"]).to include("page" => 2, "per_page" => 2, "total" => 5, "total_pages" => 3)
    end
  end

  describe "GET /products/categories" do
    def send_request(h) = get("/products/categories", headers: h)
    it_behaves_like "richiede autenticazione"

    it "elenca tutte le categorie dalla tabella in ordine alfabetico" do
      create(:product, category: create(:category, name: "sport"))
      create(:product, category: create(:category, name: "casa"))
      create(:product, category: create(:category, name: "sport"))
      create(:product, category: create(:category, name: "giardino"), active: false)
      create(:category, name: "vuota")
      get "/products/categories", headers: headers
      expect(response).to have_http_status(:ok)
      expect(json["categories"]).to eq(%w[casa giardino sport vuota])
    end
  end

  describe "GET /products/:id" do
    let(:product) { create(:product) }
    def send_request(h) = get("/products/#{product.id}", headers: h)
    it_behaves_like "richiede autenticazione"

    it "restituisce il prodotto" do
      get "/products/#{product.id}", headers: headers
      expect(response).to have_http_status(:ok)
      expect(json["product"]).to include("id" => product.id, "name" => product.name)
    end

    it "risponde 404 su id inesistente" do
      get "/products/0", headers: headers
      expect(response).to have_http_status(:not_found)
      expect(json).to have_key("error")
    end
  end
end
