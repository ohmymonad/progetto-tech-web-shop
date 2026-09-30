FactoryBot.define do
  factory :order do
    user
    full_name { "Mario Rossi" }
    email { "mario@example.com" }
    address { "Via Roma 1" }
    city { "Milano" }
    postal_code { "20100" }
    total { 0 }
    status { :pending }
  end

  factory :order_item do
    order
    product
    quantity { 1 }
    unit_price { product.price }
  end
end
