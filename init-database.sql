-- ============================================================
-- UMATIS STOKBARANG - MySQL Database Schema + Seed Data
-- Jalankan file ini di phpMyAdmin (tab SQL → paste → Go)
-- ============================================================

CREATE DATABASE IF NOT EXISTS umatis_stokbarang
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE umatis_stokbarang;

-- ============================================================
-- TABEL: profiles (user/role management)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id VARCHAR(50) PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE,
  password VARCHAR(255) DEFAULT 'demopassword123',
  role ENUM('admin', 'owner', 'barista') NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- TABEL: suppliers (vendor/pemasok bahan)
-- ============================================================
CREATE TABLE IF NOT EXISTS suppliers (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  phone VARCHAR(30) DEFAULT '',
  email VARCHAR(100) DEFAULT '',
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- TABEL: items (master barang/bahan bar)
-- ============================================================
CREATE TABLE IF NOT EXISTS items (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  category VARCHAR(50) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  current_stock DECIMAL(12,2) DEFAULT 0,
  minimum_stock DECIMAL(12,2) DEFAULT 0,
  supplier_id VARCHAR(50) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- TABEL: transactions (mutasi stok masuk/keluar/terpakai)
-- ============================================================
CREATE TABLE IF NOT EXISTS transactions (
  id VARCHAR(50) PRIMARY KEY,
  item_id VARCHAR(50) NOT NULL,
  type ENUM('masuk', 'keluar', 'terpakai') NOT NULL,
  quantity DECIMAL(12,2) NOT NULL,
  actor_id VARCHAR(50) DEFAULT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
  FOREIGN KEY (actor_id) REFERENCES profiles(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- TABEL: stock_opname (audit stok fisik vs sistem)
-- ============================================================
CREATE TABLE IF NOT EXISTS stock_opname (
  id VARCHAR(50) PRIMARY KEY,
  opname_date DATE NOT NULL,
  item_id VARCHAR(50) NOT NULL,
  system_stock DECIMAL(12,2) NOT NULL,
  physical_stock DECIMAL(12,2) NOT NULL,
  discrepancy DECIMAL(12,2) NOT NULL,
  status ENUM('draft', 'submitted', 'verified') DEFAULT 'draft',
  barista_id VARCHAR(50) DEFAULT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
  FOREIGN KEY (barista_id) REFERENCES profiles(id) ON DELETE SET NULL
) ENGINE=InnoDB;


-- ============================================================
-- SEED DATA: Profiles (Akun Demo)
-- ============================================================
INSERT INTO profiles (id, full_name, email, password, role) VALUES
  ('usr-admin', 'Budi (Admin Stok)', 'admin@umatis.com', 'demopassword123', 'admin'),
  ('usr-owner', 'Santi (Owner Umatis)', 'owner@umatis.com', 'demopassword123', 'owner'),
  ('usr-barista', 'Gede (Senior Barista)', 'barista@umatis.com', 'demopassword123', 'barista');

-- ============================================================
-- SEED DATA: Suppliers
-- ============================================================
INSERT INTO suppliers (id, name, phone, email, address) VALUES
  ('sup-1', 'Bali Kopi Roasters', '0811-389-222', 'orders@balicofee.com', 'Jl. Sunset Road No. 88, Seminyak, Bali'),
  ('sup-2', 'Monin Indonesia Distributor', '021-5698-123', 'sales@monin-indo.co.id', 'Kawasan Industri Pulogadung, Jakarta'),
  ('sup-3', 'Indomilk Horeca Bali', '0812-445-678', 'bali@indomilk-horeca.com', 'Jl. Bypass Ngurah Rai No. 100, Kuta, Bali');

-- ============================================================
-- SEED DATA: Items (Bahan Bar)
-- ============================================================
INSERT INTO items (id, name, category, unit, current_stock, minimum_stock, supplier_id) VALUES
  ('itm-1', 'Espresso Beans Toraja Blend', 'Coffee', 'gram', 4500, 1000, 'sup-1'),
  ('itm-2', 'Monin Caramel Syrup', 'Syrup', 'pcs', 12, 3, 'sup-2'),
  ('itm-3', 'Greenfields Fresh Milk 1L', 'Dairy', 'pcs', 4, 12, 'sup-3'),
  ('itm-4', 'Monin Vanilla Syrup', 'Syrup', 'pcs', 8, 3, 'sup-2'),
  ('itm-5', 'Oatmilk Oatly 1L', 'Dairy', 'pcs', 2, 8, 'sup-3'),
  ('itm-6', 'Mint Leaves Fresh', 'Garnish', 'gram', 250, 100, 'sup-1');

-- ============================================================
-- SEED DATA: Transactions (Contoh Mutasi)
-- ============================================================
INSERT INTO transactions (id, item_id, type, quantity, actor_id, notes, created_at) VALUES
  ('tx-1', 'itm-1', 'masuk', 5000, 'usr-admin', 'Restock mingguan biji kopi', DATE_SUB(NOW(), INTERVAL 2 DAY)),
  ('tx-2', 'itm-3', 'masuk', 24, 'usr-admin', 'Pengiriman dari Indomilk', DATE_SUB(NOW(), INTERVAL 1 DAY)),
  ('tx-3', 'itm-3', 'keluar', 2, 'usr-admin', 'Susu rusak/pecah di gudang', DATE_SUB(NOW(), INTERVAL 8 HOUR)),
  ('tx-4', 'itm-1', 'terpakai', 500, 'usr-barista', 'Penggunaan harian bar espresso', DATE_SUB(NOW(), INTERVAL 4 HOUR));

-- ============================================================
-- SEED DATA: Stock Opname (Contoh Audit)
-- ============================================================
INSERT INTO stock_opname (id, opname_date, item_id, system_stock, physical_stock, discrepancy, status, barista_id, notes, created_at) VALUES
  ('op-1', CURDATE() - INTERVAL 1 DAY, 'itm-1', 5000, 4980, -20, 'verified', 'usr-barista', 'Selisih wajar grind adjustment', DATE_SUB(NOW(), INTERVAL 1 DAY));
