Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check
  root "status#show"

  # Devise serve solo per la mappatura dello scope :user; le rotte sono dichiarate a mano.
  devise_for :users, skip: :all
  devise_scope :user do
    post "auth/signup", to: "auth/registrations#create"
    post "auth/login", to: "auth/sessions#create"
    delete "auth/logout", to: "auth/sessions#destroy"
  end
  get "auth/me", to: "auth/me#show"

  resources :products, only: %i[index show]

  resource :cart, only: :show
  resources :cart_items, path: "cart/items", only: %i[create update destroy]

  resources :orders, only: %i[index show create]

  namespace :admin do
    resources :products
    resources :users, only: %i[index show destroy]
  end
end
