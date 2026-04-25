-- ==========================================
-- SETUP DATABASE KASIR WARUNG (SUPABASE)
-- ==========================================

-- 1. Buat tabel Produk
CREATE TABLE IF NOT EXISTS public.kw_products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price NUMERIC NOT NULL,
    cost NUMERIC DEFAULT 0,
    stock INTEGER DEFAULT 0,
    category TEXT
);

-- 2. Buat tabel Transaksi
CREATE TABLE IF NOT EXISTS public.kw_transactions (
    id TEXT PRIMARY KEY,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total NUMERIC NOT NULL,
    pay NUMERIC DEFAULT 0,
    change NUMERIC DEFAULT 0,
    profit NUMERIC DEFAULT 0,
    method TEXT DEFAULT 'tunai',
    note TEXT
);

-- 3. Buat tabel Detail Item Transaksi (Opsional, tapi disarankan)
CREATE TABLE IF NOT EXISTS public.kw_transaction_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    transaction_id TEXT REFERENCES public.kw_transactions(id) ON DELETE CASCADE,
    product_id TEXT,
    name TEXT,
    price NUMERIC,
    cost NUMERIC,
    qty INTEGER
);

-- 4. Buka akses publik (Anon Access) agar aplikasi web bisa membaca/menulis tanpa login auth
-- PERINGATAN: Di lingkungan produksi (bukan warung lokal), Anda harus menggunakan Row Level Security (RLS).
ALTER TABLE public.kw_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kw_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kw_transaction_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public all on products" ON public.kw_products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all on transactions" ON public.kw_transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all on transaction_items" ON public.kw_transaction_items FOR ALL USING (true) WITH CHECK (true);
