require "rails_helper"

RSpec.describe User, type: :model do
  it { is_expected.to validate_presence_of(:email) }
  it { is_expected.to have_one(:cart).dependent(:destroy) }
  it { is_expected.to have_many(:orders).dependent(:destroy) }
  it { is_expected.to define_enum_for(:role).with_values(user: 0, admin: 1) }

  it "ha ruolo user di default" do
    expect(create(:user)).not_to be_admin
  end
end
