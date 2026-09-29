class CreateOrders < ActiveRecord::Migration[8.1]
  def change
    create_table :orders do |t|
      t.references :user, null: false, foreign_key: true
      t.string :full_name, null: false
      t.string :email, null: false
      t.string :address, null: false
      t.string :city, null: false
      t.string :postal_code, null: false
      t.decimal :total, precision: 10, scale: 2, null: false, default: 0
      t.integer :status, null: false, default: 0

      t.timestamps
    end
  end
end
