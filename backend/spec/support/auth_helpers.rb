module AuthHelpers
  # Esegue il login reale e restituisce l'header Authorization con il JWT.
  def auth_headers(user, password: "password123")
    post "/auth/login", params: { user: { email: user.email, password: password } }, as: :json
    { "Authorization" => response.headers["Authorization"] }
  end

  def json
    JSON.parse(response.body)
  end
end
