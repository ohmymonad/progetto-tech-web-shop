class CreateCategories < ActiveRecord::Migration[8.1]
  DEFAULT_NAME = "non-categorized".freeze

  def up
    create_table :categories do |t|
      t.string :name, null: false
      t.timestamps
    end
    add_index :categories, :name, unique: true

    execute "INSERT INTO categories (name, created_at, updated_at) VALUES ('#{DEFAULT_NAME}', NOW(), NOW())"
    execute <<~SQL
      INSERT INTO categories (name, created_at, updated_at)
      SELECT DISTINCT TRIM(category), NOW(), NOW() FROM products
      WHERE TRIM(COALESCE(category, '')) <> '' AND TRIM(category) <> '#{DEFAULT_NAME}'
    SQL

    add_reference :products, :category, foreign_key: { on_update: :cascade, on_delete: :restrict }
    execute <<~SQL
      UPDATE products SET category_id = (
        SELECT id FROM categories
        WHERE name = COALESCE(NULLIF(TRIM(products.category), ''), '#{DEFAULT_NAME}')
      )
    SQL
    change_column_null :products, :category_id, false
    remove_column :products, :category
  end

  def down
    add_column :products, :category, :string
    execute "UPDATE products SET category = c.name FROM categories c WHERE c.id = products.category_id AND c.name <> '#{DEFAULT_NAME}'"
    add_index :products, :category
    remove_reference :products, :category, foreign_key: true
    drop_table :categories
  end
end
