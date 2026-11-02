require "rails_helper"

RSpec.describe Product, type: :model do
  it { is_expected.to validate_presence_of(:name) }
  it { is_expected.to validate_presence_of(:price) }
  it { is_expected.to validate_numericality_of(:price).is_greater_than(0) }
  it { is_expected.to validate_numericality_of(:stock).only_integer.is_greater_than_or_equal_to(0) }
  it { is_expected.to have_many(:cart_items) }
  it { is_expected.to have_many(:order_items) }

  describe "scope" do
    let!(:casa) { create(:product, name: "Lampada", category: create(:category, name: "casa")) }
    let!(:sport) { create(:product, name: "Pallone", category: create(:category, name: "sport")) }
    let!(:nascosto) { create(:product, name: "Vecchio", category: create(:category, name: "casa"), active: false) }

    it "active esclude i prodotti disattivati" do
      expect(Product.active).to contain_exactly(casa, sport)
    end

    it "by_category filtra per categoria" do
      expect(Product.by_category("sport")).to contain_exactly(sport)
    end

    it "search cerca nel nome senza distinguere le maiuscole" do
      expect(Product.search("LAMP")).to contain_exactly(casa)
    end

    it "by_category e search sono concatenabili" do
      expect(Product.by_category("casa").search("lamp")).to contain_exactly(casa)
    end
  end
end
