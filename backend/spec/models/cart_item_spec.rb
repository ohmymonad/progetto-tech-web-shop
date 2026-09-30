require "rails_helper"

RSpec.describe CartItem, type: :model do
  it { is_expected.to belong_to(:cart) }
  it { is_expected.to belong_to(:product) }
  it { is_expected.to validate_numericality_of(:quantity).only_integer.is_greater_than(0) }

  it "non permette due righe per lo stesso prodotto nello stesso carrello" do
    item = create(:cart_item)
    duplicate = build(:cart_item, cart: item.cart, product: item.product)
    expect(duplicate).not_to be_valid
  end
end
