require "rails_helper"

RSpec.describe "Admin utenti", type: :request do
  let(:admin) { create(:admin) }

  describe "GET /admin/users" do
    def send_request(h) = get("/admin/users", headers: h)
    it_behaves_like "riservato agli admin"

    it "elenca gli utenti da admin" do
      create_list(:user, 2)
      get "/admin/users", headers: auth_headers(admin)
      expect(response).to have_http_status(:ok)
      expect(json["users"].size).to eq(3)
    end
  end

  describe "GET /admin/users/:id" do
    let!(:target) { create(:user) }
    def send_request(h) = get("/admin/users/#{target.id}", headers: h)
    it_behaves_like "riservato agli admin"

    it "mostra l'utente da admin" do
      get "/admin/users/#{target.id}", headers: auth_headers(admin)
      expect(response).to have_http_status(:ok)
      expect(json["user"]["id"]).to eq(target.id)
    end

    it "risponde 404 su id inesistente" do
      get "/admin/users/0", headers: auth_headers(admin)
      expect(response).to have_http_status(:not_found)
    end
  end

  describe "DELETE /admin/users/:id" do
    let!(:target) { create(:user) }
    def send_request(h) = delete("/admin/users/#{target.id}", headers: h)
    it_behaves_like "riservato agli admin"

    it "elimina l'utente da admin" do
      headers = auth_headers(admin)
      expect { delete "/admin/users/#{target.id}", headers: headers }.to change(User, :count).by(-1)
      expect(response).to have_http_status(:ok)
    end
  end
end
