# Ogni endpoint protetto deve rispondere 401 senza token.
# Richiede che il gruppo definisca `send_request(headers)`.
RSpec.shared_examples "richiede autenticazione" do
  it "risponde 401 senza token" do
    send_request(nil)
    expect(response).to have_http_status(:unauthorized)
  end
end

# Gli endpoint admin rispondono 403 a un utente normale e 401 senza token.
RSpec.shared_examples "riservato agli admin" do
  it "risponde 403 a un utente normale" do
    send_request(auth_headers(create(:user)))
    expect(response).to have_http_status(:forbidden)
  end

  it "risponde 401 senza token" do
    send_request(nil)
    expect(response).to have_http_status(:unauthorized)
  end
end
