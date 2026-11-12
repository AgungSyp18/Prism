# Laboratory Inventory & Borrowing Management System
> **Sistem Manajemen Inventaris & Peminjaman Laboratorium**  
> *Coding Talent Challenge*

Sistem informasi berbasis web untuk mengelola inventaris peralatan laboratorium komputer dan pencatatan transaksi peminjaman serta pengembalian barang secara digital.

---

## 🌟 Fitur Utama

### 1. Autentikasi & Otorisasi Berbasis Peran (RBAC)
- **ADMIN**:
  - Akses dashboard ringkasan seluruh operasional laboratorium.
  - Manajemen Barang (Tambah, Ubah, Hapus, Cari, dan Pantau Stok).
  - Manajemen Staf (Tambah akun staf, aktifkan / nonaktifkan akun staf, reset password).
  - Pencatatan peminjaman & pengembalian peralatan.
  - Akses log riwayat seluruh transaksi.
- **STAFF**:
  - Akses dashboard operasional.
  - Melihat katalog inventaris dan ketersediaan stok barang secara real-time.
  - Mencatat transaksi peminjaman barang (nama peminjam, barang, jumlah, tanggal, catatan).
  - Memproses pengembalian barang (stok dipulihkan secara otomatis).
  - Melihat riwayat transaksi yang relevan.
  - *Dibatasi*: Staff tidak dapat menghapus data barang, tidak dapat mengelola akun pengguna, dan tidak dapat mengakses menu admin.

### 2. Akun Demo Bawaan
Tersedia tombol satu-klik pada halaman Login untuk pengujian cepat:
| Peran | Username | Password | Hak Akses |
|---|---|---|---|
| **Admin** | `admin` | `admin123` | Akses penuh (Pengguna, Barang, Transaksi) |
| **Staff** | `staff` | `staff123` | Operasional peminjaman & pengembalian |

---

## 📦 Data Awal Inventaris (Sesuai Spesifikasi Soal)
Data awal barang telah disediakan dan terisi secara otomatis:
1. `BR001` - Laptop Lenovo (Stok: 5 unit)
2. `BR002` - Mouse Logitech (Stok: 10 unit)
3. `BR003` - Keyboard Mechanical (Stok: 8 unit)
4. `BR004` - Proyektor Epson (Stok: 3 unit)
5. `BR005` - Monitor LG (Stok: 6 unit)
*Item tambahan:*
6. `BR006` - Router MikroTik RB750 (Stok: 4 unit)
7. `BR007` - Switch Cisco 24-Port (Stok: 2 unit)
8. `BR008` - Webcam Logitech C920 (Stok: 7 unit)

---

## 🚀 Panduan Menjalankan Secara Lokal

### Prasyarat
- Node.js (v18+)
- PostgreSQL (Lokal via Docker atau remote via Supabase)

### Langkah-Langkah:
1. **Clone & Install Dependensi**:
   ```bash
   npm install
   ```

2. **Konfigurasi Environment**:
   Salin file `.env.example` ke `.env`:
   ```bash
   cp .env.example .env
   ```
   Atur `DATABASE_URL` ke database PostgreSQL Anda (atau Supabase).
   Anda juga dapat mengubah kredensial akun bawaan melalui:
   - `DEMO_ADMIN_USERNAME` & `DEMO_ADMIN_PASSWORD`
   - `DEMO_STAFF_USERNAME` & `DEMO_STAFF_PASSWORD`

3. **Sinkronisasi Skema & Data Awal (Seed)**:
   ```bash
   npx prisma db push
   npm run seed
   ```

4. **Jalankan Automated Tests**:
   ```bash
   npm test
   ```

5. **Jalankan Aplikasi Development**:
   ```bash
   npm run dev
   ```
   Buka browser di: [http://localhost:3000](http://localhost:3000)

---

## ☁️ Panduan Publikasi ke Hosting Publik (Vercel + Supabase)

Sesuai ketentuan challenge (WAJIB dapat diakses publik via internet):

### 1. Siapkan Database Supabase
1. Buat project baru di [supabase.com](https://supabase.com).
2. Pergi ke **Project Settings -> Database -> Connection string -> URI**.
3. Salin connection string tersebut (ganti `[YOUR-PASSWORD]` dengan password database Anda).
4. *Opsi A*: Jalankan `npx prisma db push && npm run seed` dari lokal dengan `DATABASE_URL` Supabase Anda.
5. *Opsi B*: Salin seluruh isi file [`prisma/supabase.sql`](./prisma/supabase.sql) dan jalankan di **Supabase SQL Editor**.

### 2. Hubungkan ke GitHub & Deploy ke Vercel
1. Push project ini ke repository GitHub Anda:
   ```bash
   git add .
   git commit -m "feat: Laboratory Inventory & Borrowing Management System"
   git remote add origin <URL_REPOSITORY_GITHUB_ANDA>
   git push -u origin main
   ```
2. Buka [vercel.com](https://vercel.com) dan klik **Add New Project**.
3. Import repository GitHub tersebut.
4. Pada menu **Environment Variables**, tambahkan:
   - `DATABASE_URL`: URI connection string Supabase Anda.
   - `JWT_SECRET`: sembarang string acak (misal: `super-secret-jwt-key-lab-inventory-2026`).
5. Klik **Deploy**.
6. Aplikasi akan live dan dapat diakses dosen/evaluator melalui URL publik Vercel!
