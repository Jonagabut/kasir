# Sistem POS Warung Denok

Aplikasi Point of Sale (POS) sederhana untuk warung dengan integrasi Supabase.

## Fitur

- ✅ Manajemen produk dengan kategori
- ✅ Sistem kasir dengan keranjang belanja
- ✅ Laporan transaksi dengan filter tanggal
- ✅ Dashboard dengan chart penjualan dan produk terlaris
- ✅ Edit dan hapus produk
- ✅ Detail transaksi lengkap
- ✅ Print struk dengan styling
- ✅ Validasi stok dan duplikasi produk
- ✅ Indikator stok rendah
- ✅ Responsive design

## Setup Database

1. Buat project baru di [Supabase](https://supabase.com)
2. Jalankan script SQL di `setup-database.sql` di SQL Editor Supabase
3. Update `SUPABASE_URL` dan `SUPABASE_KEY` di `app.js` dengan kredensial project Anda

## Deploy ke Vercel

1. Upload semua file ke repository Git
2. Connect repository ke Vercel
3. Deploy

## File Structure

- `index.html` - Halaman utama aplikasi
- `app.js` - Logika aplikasi dan integrasi Supabase
- `style.css` - Styling responsif dengan print styles
- `setup-database.sql` - Script setup database

## Teknologi

- HTML/CSS/JavaScript
- Supabase (Database & Auth)
- Chart.js (Charts)
- Bootstrap Icons
- Google Fonts (Poppins)

## Update Terbaru

- ✅ Fitur edit produk lengkap
- ✅ Detail transaksi dengan modal
- ✅ Filter laporan berdasarkan tanggal
- ✅ Dashboard dengan chart penjualan 7 hari dan top produk
- ✅ Print struk dengan CSS print styling
- ✅ Validasi duplikasi nama produk
- ✅ Indikator visual stok rendah
- ✅ Perbaikan perhitungan margin dan validasi input