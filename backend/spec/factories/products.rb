FactoryBot.define do
  factory :product do
    sequence(:name) { |n| "Prodotto #{n}" }
    description { "Descrizione di prova" }
    price { 10.00 }
    stock { 5 }
    category { "casa" }
    active { true }
  end
end
