FactoryBot.define do
  factory :category do
    sequence(:name) { |n| "categoria-#{n}" }
    initialize_with { Category.find_or_initialize_by(name: name) }
  end
end
