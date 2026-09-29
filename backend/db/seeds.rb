# Idempotent: safe to run more than once.

User.find_or_create_by!(email: "admin@example.com") do |user|
  user.password = "password123"
  user.role = :admin
end

User.find_or_create_by!(email: "user@example.com") do |user|
  user.password = "password123"
  user.role = :user
end

catalog = {
  "Elettronica" => [
    ["Cuffie wireless", "Cuffie over-ear con cancellazione del rumore", 89.90],
    ["Powerbank 10000 mAh", "Batteria esterna compatta USB-C", 24.50],
    ["Tastiera meccanica", "Layout italiano, switch rossi", 64.00],
    ["Mouse ergonomico", "Mouse verticale senza fili", 39.99]
  ],
  "Casa" => [
    ["Lampada da scrivania", "LED regolabile con base a ricarica", 29.90],
    ["Set di 6 tazze", "Ceramica bianca da 300 ml", 18.00],
    ["Coperta in pile", "Coperta morbida 130x170 cm", 22.50],
    ["Organizer da cucina", "Portautensili in bambù", 15.90]
  ],
  "Sport" => [
    ["Tappetino yoga", "Antiscivolo, spessore 6 mm", 19.90],
    ["Borraccia termica", "Acciaio inox 750 ml", 16.50],
    ["Corda per saltare", "Regolabile con impugnature in schiuma", 9.90],
    ["Fascia cardio", "Monitor frequenza cardiaca Bluetooth", 34.90]
  ],
  "Libri" => [
    ["Manuale di Ruby", "Introduzione al linguaggio Ruby", 32.00],
    ["Guida ad Angular", "Sviluppo di applicazioni web moderne", 36.50],
    ["Il database in pratica", "Progettazione e SQL con PostgreSQL", 29.00],
    ["Clean Architecture", "Principi di progettazione del software", 27.90]
  ],
  "Abbigliamento" => [
    ["T-shirt cotone", "T-shirt unisex 100% cotone", 14.90],
    ["Felpa con cappuccio", "Felpa felpata con tasca frontale", 39.90],
    ["Cappello invernale", "Berretto in lana", 12.00],
    ["Sciarpa in lana", "Sciarpa lunga tinta unita", 17.50]
  ]
}

catalog.each do |category, products|
  products.each_with_index do |(name, description, price), index|
    Product.find_or_create_by!(name: name) do |product|
      product.description = description
      product.price = price
      product.category = category
      product.stock = 10 + index * 5
      product.active = true
    end
  end
end
