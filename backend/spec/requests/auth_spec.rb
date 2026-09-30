require "rails_helper"

RSpec.describe "Autenticazione", type: :request do
  let!(:user) { create(:user, email: "mario@example.com") }

  describe "POST /auth/signup" do
    let(:params) { { user: { email: "nuovo@example.com", password: "password123" } } }

    it "registra l'utente e restituisce il token" do
      expect { post "/auth/signup", params: params, as: :json }.to change(User, :count).by(1)
      expect(response).to have_http_status(:created)
      expect(response.headers["Authorization"]).to start_with("Bearer ")
      expect(json["user"]).to include("email" => "nuovo@example.com", "role" => "user")
    end

    it "risponde 422 con email già usata" do
      post "/auth/signup", params: { user: { email: user.email, password: "password123" } }, as: :json
      expect(response).to have_http_status(:unprocessable_content)
      expect(json).to have_key("error")
    end

    it "risponde 422 con password troppo corta" do
      post "/auth/signup", params: { user: { email: "x@example.com", password: "123" } }, as: :json
      expect(response).to have_http_status(:unprocessable_content)
    end
  end

  describe "POST /auth/login" do
    it "restituisce il token con credenziali corrette" do
      post "/auth/login", params: { user: { email: user.email, password: "password123" } }, as: :json
      expect(response).to have_http_status(:ok)
      expect(response.headers["Authorization"]).to start_with("Bearer ")
      expect(json["user"]["email"]).to eq(user.email)
    end

    it "risponde 401 con password errata" do
      post "/auth/login", params: { user: { email: user.email, password: "sbagliata" } }, as: :json
      expect(response).to have_http_status(:unauthorized)
      expect(response.headers["Authorization"]).to be_nil
    end

    it "risponde 401 con utente inesistente" do
      post "/auth/login", params: { user: { email: "no@example.com", password: "password123" } }, as: :json
      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "GET /auth/me" do
    it "restituisce l'utente corrente" do
      get "/auth/me", headers: auth_headers(user)
      expect(response).to have_http_status(:ok)
      expect(json["user"]).to include("id" => user.id, "email" => user.email)
    end

    it "risponde 401 senza token" do
      get "/auth/me"
      expect(response).to have_http_status(:unauthorized)
    end

    it "risponde 401 con token non valido" do
      get "/auth/me", headers: { "Authorization" => "Bearer non.valido.affatto" }
      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "DELETE /auth/logout" do
    it "revoca il token: il riuso risponde 401" do
      headers = auth_headers(user)
      delete "/auth/logout", headers: headers
      expect(response).to have_http_status(:ok)

      get "/auth/me", headers: headers
      expect(response).to have_http_status(:unauthorized)
    end

    it "risponde 401 senza token" do
      delete "/auth/logout"
      expect(response).to have_http_status(:unauthorized)
    end
  end
end
