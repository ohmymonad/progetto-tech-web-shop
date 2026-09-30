require "rails_helper"

RSpec.describe Cart, type: :model do
  it { is_expected.to belong_to(:user) }
  it { is_expected.to have_many(:cart_items).dependent(:destroy) }

  it "calcola il totale come somma di quantità per prezzo" do
    cart = create(:cart)
    create(:cart_item, cart: cart, quantity: 2, unit_price: 10)
    create(:cart_item, cart: cart, quantity: 1, unit_price: 5.5)
    expect(cart.total).to eq(25.5)
  end
end
