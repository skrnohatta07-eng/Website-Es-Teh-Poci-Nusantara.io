CREATE DATABASE IF NOT EXISTS esteh_poci CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE esteh_poci;
CREATE TABLE IF NOT EXISTS shop_settings (id INT AUTO_INCREMENT PRIMARY KEY,name VARCHAR(100) NOT NULL,whatsapp VARCHAR(30),address VARCHAR(255),landmark VARCHAR(255),open_hour TINYINT UNSIGNED DEFAULT 9,close_hour TINYINT UNSIGNED DEFAULT 17,delivery_fee INT UNSIGNED DEFAULT 0,updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS menus (id INT AUTO_INCREMENT PRIMARY KEY,name VARCHAR(100) NOT NULL,category VARCHAR(30) NOT NULL,description TEXT, size VARCHAR(20) NOT NULL,price_key VARCHAR(50) NOT NULL UNIQUE,price INT UNSIGNED NOT NULL,sold_out TINYINT(1) DEFAULT 0,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS promos (id INT AUTO_INCREMENT PRIMARY KEY,code VARCHAR(30) NOT NULL UNIQUE,type ENUM('persen','tetap') NOT NULL,value INT UNSIGNED NOT NULL,minimum_purchase INT UNSIGNED DEFAULT 0,active TINYINT(1) DEFAULT 1,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS gallery (id INT AUTO_INCREMENT PRIMARY KEY,caption VARCHAR(255) NOT NULL,image_path VARCHAR(255),art_index INT DEFAULT NULL,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS orders (id INT AUTO_INCREMENT PRIMARY KEY,order_code VARCHAR(50) NOT NULL UNIQUE,created_at DATETIME DEFAULT CURRENT_TIMESTAMP,status ENUM('baru','diproses','selesai','dibatalkan') DEFAULT 'baru',created_from VARCHAR(50) DEFAULT 'website',fulfillment ENUM('ambil','antar') DEFAULT 'ambil',customer_name VARCHAR(100) NOT NULL,customer_address VARCHAR(255),customer_note TEXT,promo_code VARCHAR(30),subtotal INT UNSIGNED DEFAULT 0,discount INT UNSIGNED DEFAULT 0,delivery_fee INT UNSIGNED DEFAULT 0,total INT UNSIGNED DEFAULT 0,whatsapp_url TEXT,page_url TEXT,browser TEXT,INDEX idx_orders_status(status),INDEX idx_orders_created(created_at)) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS order_items (id INT AUTO_INCREMENT PRIMARY KEY,order_id INT NOT NULL,menu_id INT NULL,menu_name VARCHAR(100) NOT NULL,detail VARCHAR(255),unit_price INT UNSIGNED NOT NULL,quantity INT UNSIGNED NOT NULL DEFAULT 1,subtotal INT UNSIGNED NOT NULL,CONSTRAINT fk_order_items_order FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE ON UPDATE CASCADE,CONSTRAINT fk_order_items_menu FOREIGN KEY(menu_id) REFERENCES menus(id) ON DELETE SET NULL ON UPDATE CASCADE,INDEX idx_order_items_order(order_id)) ENGINE=InnoDB;
DELETE FROM shop_settings;
DELETE FROM menus;
DELETE FROM promos;
DELETE FROM gallery;
INSERT INTO shop_settings (name,whatsapp,address,landmark,open_hour,close_hour,delivery_fee) VALUES ('Es Teh Poci Nusantara','085845514171','JL. Minasa Upa Raya','Setiap hari, 09.00 sampai 17.00',9,17,5000);
INSERT INTO menus (name,category,description,size,price_key,price,sold_out) VALUES ('Es Teh Original Kecil','klasik','Teh hitam klasik, pas untuk isi ulang cepat.','kecil','original_kecil',3000,0);
INSERT INTO menus (name,category,description,size,price_key,price,sold_out) VALUES ('Es Teh Original Besar','klasik','Teh hitam klasik dengan takaran lebih besar.','besar','original_besar',4000,0);
INSERT INTO menus (name,category,description,size,price_key,price,sold_out) VALUES ('Es Teh Lemon Honey','klasik','Teh hitam dengan madu dan lemon yang segar.','besar','lemonhoney',5000,0);
INSERT INTO menus (name,category,description,size,price_key,price,sold_out) VALUES ('Es Teh Lychee','klasik','Manis lembut rasa leci, menyegarkan.','besar','lychee',5000,0);
INSERT INTO menus (name,category,description,size,price_key,price,sold_out) VALUES ('Es Teh Blackcurrant','klasik','Rasa blackcurrant yang manis asam dan pekat warnanya.','besar','blackcurrant',5000,0);
INSERT INTO menus (name,category,description,size,price_key,price,sold_out) VALUES ('Es Teh Mango','buah','Manisnya buah mangga yang tropis.','besar','mango',5000,0);
INSERT INTO menus (name,category,description,size,price_key,price,sold_out) VALUES ('Es Teh Orange','buah','Segarnya rasa jeruk, cocok untuk cuaca panas.','besar','orange',5000,0);
INSERT INTO menus (name,category,description,size,price_key,price,sold_out) VALUES ('Es Teh Guava','buah','Rasa jambu biji yang manis dan sedikit asam.','besar','guava',5000,0);
INSERT INTO menus (name,category,description,size,price_key,price,sold_out) VALUES ('Es Teh Apple','buah','Segar rasa apel merah, ringan diminum.','besar','apple',5000,0);
INSERT INTO menus (name,category,description,size,price_key,price,sold_out) VALUES ('Es Teh Chocolate','creamy','Cokelat lembut dipadu es teh yang creamy.','besar','chocolate',6000,0);
INSERT INTO menus (name,category,description,size,price_key,price,sold_out) VALUES ('Es Teh Milk Tea','creamy','Teh susu lembut, favorit banyak orang.','besar','milktea',6000,0);
INSERT INTO menus (name,category,description,size,price_key,price,sold_out) VALUES ('Es Teh Cappuccino','creamy','Aroma kopi cappuccino yang creamy dan pekat.','besar','cappuccino',6000,0);
INSERT INTO menus (name,category,description,size,price_key,price,sold_out) VALUES ('Es Teh Thai Tea','creamy','Teh Thailand yang creamy dengan warna oranye khasnya.','besar','thaitea',7000,0);
INSERT INTO promos (code,type,value,minimum_purchase,active) VALUES ('SORE10','persen',10,0,1),('HEMAT2000','tetap',2000,10000,1),('POCI7','persen',10,0,0);
INSERT INTO gallery (caption,art_index) VALUES ('Es Teh Original, resep klasik',0);
INSERT INTO gallery (caption,art_index) VALUES ('Es Teh Lemon Honey yang segar',1);
INSERT INTO gallery (caption,art_index) VALUES ('Es Teh Lychee, manis lembut',2);
INSERT INTO gallery (caption,art_index) VALUES ('Es Teh Blackcurrant',3);
INSERT INTO gallery (caption,art_index) VALUES ('Es Teh Mango, segar tropis',4);
INSERT INTO gallery (caption,art_index) VALUES ('Es Teh Guava',5);
INSERT INTO gallery (caption,art_index) VALUES ('Es Teh Milk Tea yang lembut',6);
INSERT INTO gallery (caption,art_index) VALUES ('Es Teh Thai Tea, creamy dan khas',7);

-- Data pesanan lama dari orders.json sengaja tidak diimpor.
-- Pesanan baru akan tersimpan melalui aplikasi saat dijalankan.
