
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

DROP DATABASE IF EXISTS test_phone;
CREATE DATABASE test_phone
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE test_phone;

-- =========================
-- TABLE: users
-- =========================
CREATE TABLE users (
  id int NOT NULL AUTO_INCREMENT,
  name varchar(100) NOT NULL,
  email varchar(100) NOT NULL,
  phone varchar(20) NOT NULL,
  password varchar(255) NOT NULL,
  address text,
  role enum('customer','admin') DEFAULT 'customer',
  status enum('active','inactive') DEFAULT 'active',
  created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  reset_otp varchar(10) DEFAULT NULL,
  reset_expire bigint DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY email (email),
  UNIQUE KEY phone (phone),
  KEY idx_email (email),
  KEY idx_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- TABLE: categories
-- =========================
CREATE TABLE categories (
  id int NOT NULL AUTO_INCREMENT,
  name varchar(100) NOT NULL,
  description text,
  status enum('active','inactive') DEFAULT 'active',
  created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- TABLE: brands
-- =========================
CREATE TABLE brands (
  id int NOT NULL AUTO_INCREMENT,
  name varchar(100) NOT NULL,
  description text,
  status enum('active','inactive') DEFAULT 'active',
  created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- TABLE: products
-- =========================
CREATE TABLE products (
  id int NOT NULL AUTO_INCREMENT,
  name varchar(200) NOT NULL,
  description text,
  price decimal(12,2) NOT NULL,
  stock int DEFAULT 0,
  category_id int DEFAULT NULL,
  brand_id int DEFAULT NULL,
  image varchar(255) DEFAULT NULL,
  images text,
  specs text,
  status enum('active','inactive') DEFAULT 'active',
  created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  accessory_type varchar(50) DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_category (category_id),
  KEY idx_brand (brand_id),
  KEY idx_status (status),
  FULLTEXT KEY idx_search (name, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- TABLE: product_images
-- =========================
CREATE TABLE product_images (
  id int NOT NULL AUTO_INCREMENT,
  product_id int NOT NULL,
  image_url varchar(255) NOT NULL,
  is_primary tinyint(1) DEFAULT 0,
  display_order int DEFAULT 0,
  created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_product (product_id),
  KEY idx_primary (is_primary)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- TABLE: cart
-- =========================
CREATE TABLE cart (
  id int NOT NULL AUTO_INCREMENT,
  user_id int NOT NULL,
  product_id int NOT NULL,
  quantity int DEFAULT 1,
  order_id int DEFAULT NULL,
  created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  rom_id int DEFAULT NULL,
  color_id int DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_user (user_id),
  KEY idx_order (order_id),
  KEY product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- TABLE: orders
-- =========================
CREATE TABLE orders (
  id int NOT NULL AUTO_INCREMENT,
  user_id int NOT NULL,
  order_number varchar(50) NOT NULL,
  recipient_name varchar(100) NOT NULL,
  recipient_phone varchar(20) NOT NULL,
  shipping_address text NOT NULL,
  payment_method enum('cod','bank_transfer','momo') DEFAULT 'cod',
  payment_status enum('unpaid','paid','failed') DEFAULT 'unpaid',
  subtotal decimal(12,2) NOT NULL,
  shipping_fee decimal(12,2) DEFAULT 30000,
  discount decimal(12,2) DEFAULT 0,
  total decimal(12,2) NOT NULL,
  coupon_code varchar(50) DEFAULT NULL,
  status enum('pending','processing','shipping','completed','cancelled') DEFAULT 'pending',
  created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  cancel_reason text,
  PRIMARY KEY (id),
  UNIQUE KEY order_number (order_number),
  KEY idx_user (user_id),
  KEY idx_status (status),
  KEY idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- TABLE: order_items
-- =========================
CREATE TABLE order_items (
  id int NOT NULL AUTO_INCREMENT,
  order_id int NOT NULL,
  product_id int NOT NULL,
  quantity int NOT NULL,
  price decimal(12,2) NOT NULL,
  created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_order (order_id),
  KEY product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- TABLE: coupons
-- =========================
CREATE TABLE coupons (
  id int NOT NULL AUTO_INCREMENT,
  code varchar(50) NOT NULL,
  discount_type enum('percentage','fixed') NOT NULL,
  discount_value decimal(10,2) NOT NULL,
  min_order_amount decimal(12,2) DEFAULT 0,
  max_discount decimal(12,2) DEFAULT NULL,
  max_usage int DEFAULT 1000,
  usage_count int DEFAULT 0,
  expiry_date datetime NOT NULL,
  status enum('active','inactive') DEFAULT 'active',
  created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY code (code),
  KEY idx_code (code),
  KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- TABLE: reviews
-- =========================
CREATE TABLE reviews (
  id int NOT NULL AUTO_INCREMENT,
  user_id int NOT NULL,
  product_id int NOT NULL,
  rating int NOT NULL,
  comment text,
  created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY unique_review (user_id, product_id),
  KEY idx_product (product_id)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =========================
-- TABLE: review_replies
-- =========================
CREATE TABLE review_replies (
  id int NOT NULL AUTO_INCREMENT,
  review_id int NOT NULL,
  user_id int NOT NULL,
  comment text NOT NULL,
  created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_review (review_id),
  KEY idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- FOREIGN KEYS
-- =========================
ALTER TABLE products
  ADD CONSTRAINT products_ibfk_1 FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  ADD CONSTRAINT products_ibfk_2 FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL;

ALTER TABLE cart
  ADD CONSTRAINT cart_ibfk_1 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  ADD CONSTRAINT cart_ibfk_2 FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

ALTER TABLE orders
  ADD CONSTRAINT orders_ibfk_1 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE order_items
  ADD CONSTRAINT order_items_ibfk_1 FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  ADD CONSTRAINT order_items_ibfk_2 FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

ALTER TABLE product_images
  ADD CONSTRAINT product_images_ibfk_1 FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- =========================
-- TRIGGER: generate_order_number
-- =========================
DELIMITER $$
CREATE TRIGGER generate_order_number
BEFORE INSERT ON orders
FOR EACH ROW
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    SET NEW.order_number = CONCAT(
      'ORD',
      DATE_FORMAT(NOW(), '%Y%m%d%H%i%s'),
      LPAD(FLOOR(RAND() * 100000), 5, '0')
    );
  END IF;
END$$
DELIMITER ;

COMMIT;
