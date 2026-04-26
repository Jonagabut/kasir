-- ==========================================
-- SETUP DATABASE KASIR WARUNG - LENGKAP
-- ==========================================
-- Jalankan script ini di Supabase SQL Editor
-- https://app.supabase.com → SQL Editor → New Query

-- ========== 1. DROP TABEL LAMA (jika ada) ==========
DROP TABLE IF EXISTS public.kw_transaction_items CASCADE;
DROP TABLE IF EXISTS public.kw_transactions CASCADE;
DROP TABLE IF EXISTS public.kw_products CASCADE;

-- ========== 2. CREATE TABEL PRODUK ==========
CREATE TABLE IF NOT EXISTS public.kw_products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    price NUMERIC NOT NULL DEFAULT 0,
    cost NUMERIC DEFAULT 0,
    stock INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.kw_products IS 'Daftar produk warung';

-- ========== 3. CREATE TABEL TRANSAKSI ==========
CREATE TABLE IF NOT EXISTS public.kw_transactions (
    id TEXT PRIMARY KEY,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total NUMERIC NOT NULL DEFAULT 0,
    discount NUMERIC DEFAULT 0,
    pay NUMERIC DEFAULT 0,
    change NUMERIC DEFAULT 0,
    profit NUMERIC DEFAULT 0,
    method TEXT DEFAULT 'tunai',
    items JSONB DEFAULT '[]'::jsonb,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns if they don't exist
ALTER TABLE public.kw_transactions ADD COLUMN IF NOT EXISTS discount NUMERIC DEFAULT 0;
ALTER TABLE public.kw_transactions ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb;

COMMENT ON TABLE public.kw_transactions IS 'Riwayat transaksi penjualan dengan daftar item';

-- ========== 5. ENABLE RLS ==========
ALTER TABLE public.kw_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kw_transactions ENABLE ROW LEVEL SECURITY;

-- ========== 6. CREATE RLS POLICIES ==========
-- Produk - Allow all operasi
CREATE POLICY "kw_products_allow_all" ON public.kw_products
FOR ALL
USING (true)
WITH CHECK (true);

-- Transactions - Allow all operasi
CREATE POLICY "kw_transactions_allow_all" ON public.kw_transactions
FOR ALL
USING (true)
WITH CHECK (true);

-- ========== 7. CREATE INDEXES ==========
CREATE INDEX idx_kw_products_category ON public.kw_products(category);
CREATE INDEX idx_kw_products_name ON public.kw_products(name);
CREATE INDEX idx_kw_transactions_date ON public.kw_transactions(date);

-- ========== 8. VERIFY ==========
-- Jalankan query di bawah untuk verifikasi

-- Cek tabel sudah ada
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' AND tablename IN ('kw_products', 'kw_transactions');

-- Cek RLS enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' AND tablename IN ('kw_products', 'kw_transactions');

-- Cek policies
SELECT tablename, policyname, permissive, roles, qual, with_check 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename IN ('kw_products', 'kw_transactions');
