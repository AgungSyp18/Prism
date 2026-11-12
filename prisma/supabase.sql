-- ==========================================================
-- Laboratory Inventory & Borrowing Management System
-- Supabase PostgreSQL Schema & Initial Data Seed
-- ==========================================================

-- 1. Create Enums
DO $$ BEGIN
    CREATE TYPE "Role" AS ENUM ('ADMIN', 'STAFF');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "TransactionStatus" AS ENUM ('DIPINJAM', 'DIKEMBALIKAN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create Users Table
CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT PRIMARY KEY,
    "username" TEXT UNIQUE NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'STAFF',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create Items Table
CREATE TABLE IF NOT EXISTS "items" (
    "id" TEXT PRIMARY KEY,
    "code" TEXT UNIQUE NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create Borrow Transactions Table
CREATE TABLE IF NOT EXISTS "borrow_transactions" (
    "id" TEXT PRIMARY KEY,
    "borrowerName" TEXT NOT NULL,
    "itemId" TEXT NOT NULL REFERENCES "items"("id") ON DELETE RESTRICT,
    "quantity" INTEGER NOT NULL,
    "borrowDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "returnDate" TIMESTAMP(3),
    "status" "TransactionStatus" NOT NULL DEFAULT 'DIPINJAM',
    "userId" TEXT NOT NULL REFERENCES "users"("id"),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. Seed Initial Data (Required 5 Items from Specification + Accounts)
-- Passwords below are hashed with bcrypt for:
-- admin -> admin123
-- staff -> staff123
INSERT INTO "users" ("id", "username", "password", "name", "role", "isActive", "createdAt", "updatedAt")
VALUES 
    ('user_admin_01', 'admin', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.Uom8z9x2a4t0eM0y55fI8R3H5d6Uf0a', 'Administrator Lab', 'ADMIN', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('user_staff_01', 'staff', '$2a$10$4n9UoB9Xy8K8O6m1XlqAfeJ3LqJt5Z4V8K3p7Y4W5L9O1Q2Z3X4Y5', 'Staff Petugas Lab', 'STAFF', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("username") DO NOTHING;

INSERT INTO "items" ("id", "code", "name", "category", "stock", "createdAt", "updatedAt")
VALUES
    ('item_001', 'BR001', 'Laptop Lenovo', 'Laptop', 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('item_002', 'BR002', 'Mouse Logitech', 'Aksesoris', 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('item_003', 'BR003', 'Keyboard Mechanical', 'Aksesoris', 8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('item_004', 'BR004', 'Proyektor Epson', 'Multimedia', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('item_005', 'BR005', 'Monitor LG', 'Display', 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('item_006', 'BR006', 'Router MikroTik RB750', 'Jaringan', 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('item_007', 'BR007', 'Switch Cisco 24-Port', 'Jaringan', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('item_008', 'BR008', 'Webcam Logitech C920', 'Multimedia', 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;
