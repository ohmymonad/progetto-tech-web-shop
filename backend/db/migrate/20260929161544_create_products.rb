# Products, che rappresentano gli articoli disponibili per la vendita nel negozio online.
class CreateProducts < ActiveRecord::Migration[8.1]
  def change
    create_table :products do |t|
      t.string :name, null: false
      t.text :description
      t.decimal :price, precision: 10, scale: 2, null: false
      t.integer :stock, null: false, default: 0
      t.string :category 
      t.boolean :active, null: false, default: true

      t.timestamps
    end
    add_index :products, :category
  end
end
