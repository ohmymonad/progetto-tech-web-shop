class DeviseCreateUsers < ActiveRecord::Migration[8.1]
  def change
    create_table :users do |t|
      t.string :email,              null: false, default: ""
      t.string :encrypted_password, null: false, default: ""
      t.integer :role,              null: false, default: 0

      t.timestamps null: false
    end

    add_index :users, :email, unique: true
  end
end
