Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check
  root "status#show"

  # Devise serve solo per la mappatura dello scope :user; le rotte sono dichiarate a mano.
  devise_for :users, skip: :all
  devise_scope :user do
    post "auth/signup", to: "auth/registrations#create" #crea un nuovo utente 
    post "auth/login", to: "auth/sessions#create" # ritorna jwt di login 
    delete "auth/logout", to: "auth/sessions#destroy" #distroy jwt di login
  end
  # La rotta GET /auth/me serve per ottenere i dati dell'utente loggato, se il token JWT è valido.
  # Il controller Auth::MeController#show restituisce i dati dell'utente loggato, se il token JWT è valido.
  # altrimenti restituisce un errore 401 Unauthorized.(per esempio se il token è scaduto o non valido)
  get "auth/me", to: "auth/me#show"

  ## ----
  ## ricordiamo sempre per la resources sintax https://guides.rubyonrails.org/routing.html - sezione 2.2 CRUD, Verbs, Actions
  ## ----


  #endpoint prodotti e categorie
  resources :products, only: %i[index show] do
    get :categories, on: :collection
  end

  resource :cart, only: :show
  resources :cart_items, path: "cart/items", only: %i[create update destroy]
  # a che routes precise corrisponde
  # ordine farlocco che fallisce sempre (dopo 5s): prima di resources :orders per non finire in orders/:id
  post "orders/fail", to: "orders#create_failing"
  resources :orders, only: %i[index show create]

  namespace :admin do
    resources :products
    resources :users, only: %i[index show destroy]
  end
end
