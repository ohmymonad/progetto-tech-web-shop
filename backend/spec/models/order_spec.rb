require "rails_helper"

RSpec.describe Order, type: :model do
  it { is_expected.to belong_to(:user) }
  it { is_expected.to have_many(:order_items).dependent(:destroy) }
  it { is_expected.to validate_presence_of(:full_name) }
  it { is_expected.to validate_presence_of(:email) }
  it { is_expected.to validate_presence_of(:address) }
  it { is_expected.to validate_presence_of(:city) }
  it { is_expected.to validate_presence_of(:postal_code) }
  it { is_expected.to define_enum_for(:status).with_values(pending: 0, paid: 1, shipped: 2, cancelled: 3) }

  it "parte in stato pending" do
    expect(build(:order).status).to eq("pending")
  end
end
