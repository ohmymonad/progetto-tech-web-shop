FactoryBot.define do
  factory :user do
    sequence(:email) { |n| "utente#{n}@example.com" }
    password { "password123" }
    role { :user }

    factory :admin do
      role { :admin }
    end
  end
end
