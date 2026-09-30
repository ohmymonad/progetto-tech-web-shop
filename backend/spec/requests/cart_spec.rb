require "rails_helper"

RSpec.describe "Carrello", type: :request do
  let(:user) { create(:user) }
  let(:headers) { auth_headers(user) }
  let(:product) { create(:product, price: 12.5) }

  describe "GET /cart" do
    def send_request(h) = get("/cart", headers: h)
    it_behaves_like "richiede autenticazione"

    it "crea il carrello se assente" do
      headers
      expect { get "/cart", headers: headers }.to change(Cart, :count).by(1)
      expect(response).to have_http_status(:ok)
      expect(json["cart"]["items"]).to eq([])
    end

    it "restituisce righe e totale" do
      cart = create(:cart, user: user)
      create(:cart_item, cart: cart, product: product, quantity: 2, unit_price: 12.5)
      get "/cart", headers: headers
      expect(json["cart"]["items"].size).to eq(1)
      expect(json["cart"]["total"].to_f).to eq(25.0)
    end
  end

  describe "POST /cart/items" do
    def send_request(h) = post("/cart/items", params: { product_id: product.id, quantity: 1 }, headers: h, as: :json)
    it_behaves_like "richiede autenticazione"

    it "aggiunge un nuovo prodotto" do
      post "/cart/items", params: { product_id: product.id, quantity: 2 }, headers: headers, as: :json
      expect(response).to have_http_status(:created)
      expect(json["cart"]["items"].first).to include("quantity" => 2)
      expect(user.reload.cart.cart_items.first.unit_price).to eq(12.5)
    end

    it "incrementa la quantità se il prodotto è già presente" do
      post "/cart/items", params: { product_id: product.id, quantity: 2 }, headers: headers, as: :json
      expect {
        post "/cart/items", params: { product_id: product.id, quantity: 3 }, headers: headers, as: :json
      }.not_to change(CartItem, :count)
      expect(user.reload.cart.cart_items.first.quantity).to eq(5)
    end

    it "risponde 422 con quantità <= 0" do
      post "/cart/items", params: { product_id: product.id, quantity: 0 }, headers: headers, as: :json
      expect(response).to have_http_status(:unprocessable_content)
    end

    it "risponde 404 con prodotto inesistente" do
      post "/cart/items", params: { product_id: 0, quantity: 1 }, headers: headers, as: :json
      expect(response).to have_http_status(:not_found)
    end
  end

  describe "PATCH /cart/items/:id" do
    let!(:item) { create(:cart_item, cart: create(:cart, user: user), product: product, quantity: 1) }
    def send_request(h) = patch("/cart/items/#{item.id}", params: { quantity: 4 }, headers: h, as: :json)
    it_behaves_like "richiede autenticazione"

    it "aggiorna la quantità" do
      patch "/cart/items/#{item.id}", params: { quantity: 4 }, headers: headers, as: :json
      expect(response).to have_http_status(:ok)
      expect(item.reload.quantity).to eq(4)
    end

    it "risponde 422 con quantità <= 0" do
      patch "/cart/items/#{item.id}", params: { quantity: 0 }, headers: headers, as: :json
      expect(response).to have_http_status(:unprocessable_content)
      expect(item.reload.quantity).to eq(1)
    end

    it "risponde 403 su item di un altro utente" do
      other = create(:cart_item)
      patch "/cart/items/#{other.id}", params: { quantity: 4 }, headers: headers, as: :json
      expect(response).to have_http_status(:forbidden)
      expect(other.reload.quantity).to eq(1)
    end
  end

  describe "DELETE /cart/items/:id" do
    let!(:item) { create(:cart_item, cart: create(:cart, user: user), product: product) }
    def send_request(h) = delete("/cart/items/#{item.id}", headers: h)
    it_behaves_like "richiede autenticazione"

    it "rimuove la riga" do
      expect { delete "/cart/items/#{item.id}", headers: headers }.to change(CartItem, :count).by(-1)
      expect(response).to have_http_status(:ok)
    end

    it "risponde 403 su item di un altro utente" do
      other = create(:cart_item)
      expect { delete "/cart/items/#{other.id}", headers: headers }.not_to change(CartItem, :count)
      expect(response).to have_http_status(:forbidden)
    end
  end
end
