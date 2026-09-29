class User < ApplicationRecord
  devise :database_authenticatable, :registerable, :validatable,
         :jwt_authenticatable, jwt_revocation_strategy: JwtDenylist

  enum :role, { user: 0, admin: 1 }, default: :user

  has_one :cart, dependent: :destroy
  has_many :orders, dependent: :destroy
end
