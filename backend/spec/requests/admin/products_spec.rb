require "rails_helper"

RSpec.describe "Admin prodotti", type: :request do
  let(:admin) { create(:admin) }
  let(:attrs) { { name: "Nuovo", description: "d", price: 9.9, stock: 3, category_id: create(:category).id, active: true } }

  describe "POST /admin/products" do
    def send_request(h) = post("/admin/products", params: { product: attrs }, headers: h, as: :json)
    it_behaves_like "riservato agli admin"

    it "crea il prodotto da admin" do
      expect { post "/admin/products", params: { product: attrs }, headers: auth_headers(admin), as: :json }
        .to change(Product, :count).by(1)
      expect(response).to have_http_status(:created)
      expect(json["product"]["name"]).to eq("Nuovo")
    end

    it "risponde 422 con dati non validi" do
      post "/admin/products", params: { product: attrs.merge(price: -1) }, headers: auth_headers(admin), as: :json
      expect(response).to have_http_status(:unprocessable_content)
    end
  end

  describe "PATCH /admin/products/:id" do
    let!(:product) { create(:product) }
    def send_request(h) = patch("/admin/products/#{product.id}", params: { product: { name: "X" } }, headers: h, as: :json)
    it_behaves_like "riservato agli admin"

    it "aggiorna il prodotto da admin" do
      patch "/admin/products/#{product.id}", params: { product: { name: "Cambiato" } }, headers: auth_headers(admin), as: :json
      expect(response).to have_http_status(:ok)
      expect(product.reload.name).to eq("Cambiato")
    end
  end

  describe "DELETE /admin/products/:id" do
    let!(:product) { create(:product) }
    def send_request(h) = delete("/admin/products/#{product.id}", headers: h)
    it_behaves_like "riservato agli admin"

    it "elimina il prodotto da admin" do
      expect { delete "/admin/products/#{product.id}", headers: auth_headers(admin) }
        .to change(Product, :count).by(-1)
      expect(response).to have_http_status(:ok)
    end

    it "risponde 404 su id inesistente" do
      delete "/admin/products/0", headers: auth_headers(admin)
      expect(response).to have_http_status(:not_found)
    end
  end
end
