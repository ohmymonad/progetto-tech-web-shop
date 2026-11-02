require "rails_helper"

RSpec.describe Category, type: :model do
  it { is_expected.to validate_presence_of(:name) }
  it { is_expected.to have_many(:products) }

  describe "eliminazione" do
    it "sposta i prodotti nella categoria di default (set default)" do
      category = create(:category, name: "sport")
      product = create(:product, category: category)
      category.destroy!
      expect(product.reload.category).to eq(Category.default)
    end

    it "non elimina la categoria di default" do
      expect(Category.default.destroy).to be(false)
      expect(Category.exists?(name: Category::DEFAULT_NAME)).to be(true)
    end
  end

  describe "rinomina" do
    it "si propaga ai prodotti (cascade): il nome è letto dalla categoria" do
      category = create(:category, name: "sport")
      product = create(:product, category: category)
      category.update!(name: "fitness")
      expect(product.reload.category.name).to eq("fitness")
    end

    it "non permette di rinominare la categoria di default" do
      expect(Category.default.update(name: "altro")).to be(false)
    end
  end

  it "assegna la categoria di default a un prodotto senza categoria" do
    expect(create(:product, category: nil).category).to eq(Category.default)
  end
end
