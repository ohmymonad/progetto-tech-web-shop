require "rails_helper"

RSpec.describe "Ordini", type: :request do
  let(:user) { create(:user) }
  let(:headers) { auth_headers(user) }
  let(:customer) do
    { full_name: "Mario Rossi", email: "mario@example.com", address: "Via Roma 1",
      city: "Milano", postal_code: "20100" }
  end

  # niente attesa reale di 5s nei test
  before { allow_any_instance_of(OrdersController).to receive(:sleep) }

  describe "POST /orders/fail" do
    def send_request(h) = post("/orders/fail", params: { order: customer }, headers: h, as: :json)
    it_behaves_like "richiede autenticazione"

    it "risponde sempre 422 con il messaggio fisso, senza creare ordini né toccare il carrello" do
      cart = create(:cart, user: user)
      create(:cart_item, cart: cart, product: create(:product), quantity: 1, unit_price: 10)

      expect { send_request(headers) }.not_to change(Order, :count)
      expect(response).to have_http_status(:unprocessable_content)
      expect(json["error"]).to eq("errore - ordine non andato a buon fine")
      expect(user.reload.cart.cart_items.count).to eq(1)
    end
  end

  describe "POST /orders" do
    def send_request(h) = post("/orders", params: { order: customer }, headers: h, as: :json)
    it_behaves_like "richiede autenticazione"

    context "con carrello pieno" do
      let(:product) { create(:product, price: 10) }
      before do
        cart = create(:cart, user: user)
        create(:cart_item, cart: cart, product: product, quantity: 3, unit_price: 10)
      end

      it "crea l'ordine, calcola il totale e svuota il carrello" do
        expect { post "/orders", params: { order: customer }, headers: headers, as: :json }
          .to change(Order, :count).by(1).and change(OrderItem, :count).by(1)
        expect(response).to have_http_status(:created)
        expect(json["order"]["total"].to_f).to eq(30.0)
        expect(json["order"]["status"]).to eq("pending")
        expect(user.reload.cart.cart_items).to be_empty
      end

      it "congela il prezzo: modifiche successive al prodotto non cambiano l'ordine" do
        post "/orders", params: { order: customer }, headers: headers, as: :json
        product.update!(price: 99)
        expect(Order.last.order_items.first.unit_price).to eq(10)
        expect(Order.last.total).to eq(30)
      end

      it "risponde 422 con dati cliente mancanti e non svuota il carrello" do
        post "/orders", params: { order: customer.merge(address: "") }, headers: headers, as: :json
        expect(response).to have_http_status(:unprocessable_content)
        expect(user.reload.cart.cart_items.count).to eq(1)
        expect(Order.count).to eq(0)
        expect(product.reload.stock).to eq(5)
      end

      it "scala dal magazzino le quantità ordinate" do
        expect { post "/orders", params: { order: customer }, headers: headers, as: :json }
          .to change { product.reload.stock }.from(5).to(2)
      end
    end

    context "con disponibilità insufficiente" do
      let(:available) { create(:product, name: "Mouse", stock: 5) }
      let(:scarce) { create(:product, name: "Tastiera", stock: 1) }
      before do
        cart = create(:cart, user: user)
        create(:cart_item, cart: cart, product: available, quantity: 2, unit_price: 10)
        create(:cart_item, cart: cart, product: scarce, quantity: 2, unit_price: 10)
      end

      it "risponde 422 indicando il prodotto e non modifica nulla" do
        post "/orders", params: { order: customer }, headers: headers, as: :json
        expect(response).to have_http_status(:unprocessable_content)
        expect(json["error"]).to include("Tastiera")
        expect(Order.count).to eq(0)
        expect(available.reload.stock).to eq(5)
        expect(scarce.reload.stock).to eq(1)
        expect(user.reload.cart.cart_items.count).to eq(2)
      end
    end

    it "risponde 422 con carrello vuoto" do
      post "/orders", params: { order: customer }, headers: headers, as: :json
      expect(response).to have_http_status(:unprocessable_content)
      expect(json["error"]).to be_present
    end
  end

  describe "GET /orders" do
    def send_request(h) = get("/orders", headers: h)
    it_behaves_like "richiede autenticazione"

    it "elenca solo gli ordini dell'utente" do
      mine = create(:order, user: user)
      create(:order)
      get "/orders", headers: headers
      expect(json["orders"].map { |o| o["id"] }).to eq([mine.id])
    end

    it "filtra per ?status=" do
      create(:order, user: user, status: :pending)
      paid = create(:order, user: user, status: :paid)
      get "/orders", params: { status: "paid" }, headers: headers
      expect(json["orders"].map { |o| o["id"] }).to eq([paid.id])
    end

    it "filtra per intervallo di date ?from=&to=" do
      create(:order, user: user, created_at: Date.new(2026, 1, 10))
      inside = create(:order, user: user, created_at: Date.new(2026, 2, 10))
      create(:order, user: user, created_at: Date.new(2026, 3, 10))
      get "/orders", params: { from: "2026-02-01", to: "2026-02-28" }, headers: headers
      expect(json["orders"].map { |o| o["id"] }).to eq([inside.id])
    end
  end

  describe "GET /orders/:id" do
    let(:order) { create(:order, user: user) }
    def send_request(h) = get("/orders/#{order.id}", headers: h)
    it_behaves_like "richiede autenticazione"

    it "restituisce il dettaglio con le righe" do
      create(:order_item, order: order, quantity: 2, unit_price: 7)
      get "/orders/#{order.id}", headers: headers
      expect(response).to have_http_status(:ok)
      expect(json["order"]["items"].size).to eq(1)
      expect(json["order"]["items"].first).to include("quantity" => 2)
    end

    it "risponde 404 su ordine altrui" do
      other = create(:order)
      get "/orders/#{other.id}", headers: headers
      expect(response).to have_http_status(:not_found)
    end
  end
end
