# 📚 DOKUMENTASI KODE — Stokbarang Umatis

## Aplikasi Manajemen Inventaris Bar & Stock Opname

**Teknologi yang digunakan:**
- **Next.js 16** — Framework React full-stack (frontend + backend API)
- **TypeScript** — JavaScript dengan type-checking
- **MySQL** — Database relasional (dikelola via phpMyAdmin / XAMPP)
- **mysql2** — Library koneksi MySQL untuk Node.js
- **Tailwind CSS 4** — Utility-first CSS framework
- **Lucide React** — Library ikon modern

---

# DAFTAR ISI

1. [Struktur Folder Project](#1-struktur-folder-project)
2. [File Konfigurasi](#2-file-konfigurasi)
3. [Type Definitions (types/index.ts)](#3-type-definitions)
4. [Database Connection (lib/db.ts)](#4-database-connection)
5. [API Client (lib/api-client.ts)](#5-api-client)
6. [SQL Schema (init-database.sql)](#6-sql-schema)
7. [Styling (globals.css)](#7-styling-globalscss)
8. [Layout (layout.tsx)](#8-layout-layouttsx)
9. [Halaman Login (page.tsx)](#9-halaman-login)
10. [API Routes (Backend)](#10-api-routes-backend)
11. [Halaman Admin (admin/page.tsx)](#11-halaman-admin)
12. [Halaman Owner (owner/page.tsx)](#12-halaman-owner)
13. [Halaman Barista (barista/page.tsx)](#13-halaman-barista)
14. [Komponen Mock Warning](#14-komponen-mock-warning)
15. [Alur Kerja Aplikasi](#15-alur-kerja-aplikasi)

---

# 1. Struktur Folder Project

```
stokbarang-umatis/
├── .env.local                  ← Konfigurasi environment (DB credentials)
├── init-database.sql           ← SQL untuk membuat database di phpMyAdmin
├── package.json                ← Daftar dependency & script
├── next.config.ts              ← Konfigurasi Next.js
├── tsconfig.json               ← Konfigurasi TypeScript
│
└── src/
    ├── types/
    │   └── index.ts            ← Definisi tipe data (TypeScript interfaces)
    │
    ├── lib/
    │   ├── db.ts               ← Koneksi ke MySQL database
    │   └── api-client.ts       ← Fungsi fetch untuk memanggil API dari frontend
    │
    ├── components/
    │   └── mock-warning.tsx    ← Komponen banner status koneksi database
    │
    └── app/
        ├── globals.css         ← Styling global (tema warna, glassmorphism)
        ├── layout.tsx          ← Layout utama (font, metadata SEO)
        ├── page.tsx            ← Halaman Login
        │
        ├── admin/
        │   └── page.tsx        ← Dashboard Admin (CRUD lengkap)
        │
        ├── owner/
        │   └── page.tsx        ← Dashboard Owner (monitoring & export CSV)
        │
        ├── barista/
        │   └── page.tsx        ← Dashboard Barista (stock opname)
        │
        └── api/                ← Backend API Routes (server-side)
            ├── auth/login/route.ts
            ├── profiles/route.ts
            ├── suppliers/route.ts
            ├── suppliers/[id]/route.ts
            ├── items/route.ts
            ├── items/[id]/route.ts
            ├── transactions/route.ts
            ├── opnames/route.ts
            └── opnames/[id]/route.ts
```

---

# 2. File Konfigurasi

## `.env.local` — Environment Variables

```env
# Konfigurasi koneksi MySQL (phpMyAdmin / XAMPP)
DB_HOST=localhost       ← Alamat server MySQL (localhost karena XAMPP di PC sendiri)
DB_PORT=3306            ← Port default MySQL
DB_USER=root            ← Username default XAMPP MySQL
DB_PASSWORD=            ← Password (kosong untuk XAMPP default)
DB_NAME=umatis_stokbarang  ← Nama database yang kita buat di phpMyAdmin
```

**Penjelasan:** File ini menyimpan informasi sensitif (seperti kredensial database) yang TIDAK boleh di-upload ke GitHub. Next.js otomatis membaca file ini saat startup.

## `package.json` — Dependency

```json
"dependencies": {
    "lucide-react": "^1.17.0",   ← Library ikon (Package, Users, Truck, dll)
    "mysql2": "...",              ← Driver koneksi MySQL untuk Node.js
    "next": "16.2.7",            ← Framework Next.js (React full-stack)
    "react": "19.2.4",           ← Library UI React
    "react-dom": "19.2.4"        ← React DOM renderer
},
"devDependencies": {
    "tailwindcss": "^4",         ← CSS framework utility-first
    "typescript": "^5"           ← Superset JavaScript dengan type-checking
}
```

---

# 3. Type Definitions

## `src/types/index.ts` — Definisi Tipe Data

```typescript
// Tipe untuk role pengguna — hanya boleh salah satu dari 3 nilai ini
export type UserRole = 'admin' | 'owner' | 'barista';
```
**Penjelasan:** `type` di TypeScript mendefinisikan nilai yang diperbolehkan. Di sini, role hanya bisa `admin`, `owner`, atau `barista`.

```typescript
// Interface = "cetakan" bentuk data profil pengguna
export interface Profile {
  id: string;           // ID unik user, contoh: 'usr-admin'
  full_name: string;    // Nama lengkap, contoh: 'Budi (Admin Stok)'
  role: UserRole;       // Peran pengguna (admin/owner/barista)
  updated_at: string;   // Waktu terakhir diupdate (format ISO)
}
```
**Penjelasan:** `interface` mendefinisikan "bentuk" objek data. Setiap Profile HARUS punya `id`, `full_name`, `role`, dan `updated_at`.

```typescript
export interface Supplier {
  id: string;           // ID unik supplier, contoh: 'sup-1'
  name: string;         // Nama supplier, contoh: 'Bali Kopi Roasters'
  phone: string;        // No telepon
  email: string;        // Email supplier
  address: string;      // Alamat lengkap
  created_at: string;   // Waktu data dibuat
}
```

```typescript
export interface Item {
  id: string;                    // ID unik barang, contoh: 'itm-1'
  name: string;                  // Nama bahan, contoh: 'Espresso Beans Toraja Blend'
  category: string;              // Kategori: Coffee, Syrup, Dairy, Garnish
  unit: string;                  // Satuan: gram, pcs, ml
  current_stock: number;         // Stok saat ini (angka)
  minimum_stock: number;         // Batas minimum stok (untuk warning)
  supplier_id: string | null;    // ID supplier terkait (bisa null / kosong)
  supplier_name?: string;        // Nama supplier (opsional, diisi dari JOIN query)
  created_at: string;
}
```
**Penjelasan:** Tanda `?` artinya properti bersifat opsional (boleh tidak ada). `string | null` artinya bisa berisi string ATAU null.

```typescript
export interface Transaction {
  id: string;
  item_id: string;         // Merujuk ke barang mana
  item_name?: string;      // Nama barang (diisi dari JOIN, opsional)
  category?: string;
  unit?: string;
  type: 'masuk' | 'keluar' | 'terpakai';  // Jenis mutasi stok
  quantity: number;        // Jumlah barang
  actor_id: string;        // Siapa yang melakukan transaksi
  actor_name?: string;     // Nama petugas (dari JOIN)
  notes: string;           // Catatan/keterangan
  created_at: string;
}
```

```typescript
export interface StockOpname {
  id: string;
  opname_date: string;      // Tanggal audit dilakukan
  item_id: string;
  item_name?: string;
  category?: string;
  unit?: string;
  system_stock: number;     // Stok yang tercatat di sistem
  physical_stock: number;   // Stok fisik yang dihitung barista
  discrepancy: number;      // Selisih = physical_stock - system_stock
  status: 'draft' | 'submitted' | 'verified';  // Status validasi
  barista_id: string;       // ID barista yang melakukan opname
  barista_name?: string;
  notes: string;
  created_at: string;
}
```

---

# 4. Database Connection

## `src/lib/db.ts` — Koneksi MySQL

```typescript
import mysql from 'mysql2/promise';
```
**Baris 1:** Mengimpor library `mysql2` versi Promise (async/await). Ini memungkinkan kita menjalankan query MySQL secara asynchronous.

```typescript
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'umatis_stokbarang',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});
```
**Penjelasan per baris:**
- `createPool()` — Membuat **connection pool** (kumpulan koneksi yang siap pakai). Lebih efisien daripada membuat koneksi baru setiap kali query.
- `process.env.DB_HOST` — Membaca nilai dari file `.env.local`. Jika tidak ada, pakai `'localhost'` sebagai default.
- `connectionLimit: 10` — Maksimal 10 koneksi aktif bersamaan ke database.
- `waitForConnections: true` — Jika semua 10 koneksi sedang dipakai, request baru akan menunggu (antri) daripada langsung error.

```typescript
export default pool;
```
**Baris terakhir:** Mengekspor pool agar bisa dipakai di file lain (API routes) dengan `import pool from '@/lib/db'`.

---

# 5. API Client

## `src/lib/api-client.ts` — Fungsi Pemanggil API dari Frontend

File ini berisi fungsi-fungsi yang dipakai oleh halaman React untuk berkomunikasi dengan API backend.

```typescript
const headers = { 'Content-Type': 'application/json' };
```
**Penjelasan:** Header HTTP yang memberitahu server bahwa data yang dikirim berformat JSON.

### Login

```typescript
export const loginUser = async (email: string, password: string) => {
  // Kirim POST request ke endpoint /api/auth/login
  const res = await fetch('/api/auth/login', {
    method: 'POST',                              // Method HTTP POST
    headers,                                      // Content-Type: application/json
    body: JSON.stringify({ email, password }),     // Ubah objek JS jadi string JSON
  });
  const data = await res.json();        // Parse response jadi objek JS
  if (!res.ok) throw new Error(data.error || 'Login gagal.');  // Jika status bukan 2xx, throw error
  return data;                          // Kembalikan data user (id, role, dll)
};
```
**Penjelasan:** `fetch()` adalah API browser untuk mengirim HTTP request. `await` menunggu response sebelum lanjut ke baris berikutnya.

### Get Data (Contoh: Items)

```typescript
export const getItems = async () => {
  const res = await fetch('/api/items');             // GET request (default method)
  if (!res.ok) throw new Error('Gagal mengambil data barang.');
  return res.json();                                 // Parse & return data JSON
};
```

### Save Data (Contoh: Items)

```typescript
export const saveItem = async (item: Record<string, any>) => {
  const res = await fetch('/api/items', {
    method: 'POST',                    // POST = kirim data baru / update
    headers,
    body: JSON.stringify(item),        // Data item dikonversi ke JSON string
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Gagal menyimpan barang.');
  return data;
};
```

### Delete Data (Contoh: Items)

```typescript
export const deleteItem = async (id: string) => {
  const res = await fetch(`/api/items/${id}`, { method: 'DELETE' });
  // Template literal (`...${id}`) memasukkan ID ke URL, contoh: /api/items/itm-1
  if (!res.ok) throw new Error('Gagal menghapus barang.');
  return res.json();
};
```

### Health Check

```typescript
export const checkDbConnection = async (): Promise<boolean> => {
  try {
    const res = await fetch('/api/profiles');   // Coba fetch profiles
    return res.ok;        // Jika berhasil (status 200), return true
  } catch {
    return false;         // Jika error (MySQL mati), return false
  }
};
```
**Penjelasan:** Digunakan oleh komponen `MockWarning` untuk mengecek apakah database MySQL sedang berjalan.

---

# 6. SQL Schema

## `init-database.sql` — Pembuatan Database & Tabel

```sql
CREATE DATABASE IF NOT EXISTS umatis_stokbarang
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```
**Penjelasan:**
- `CREATE DATABASE IF NOT EXISTS` — Buat database hanya jika belum ada (mencegah error duplicate)
- `utf8mb4` — Encoding karakter yang mendukung emoji dan karakter internasional
- `COLLATE utf8mb4_unicode_ci` — Aturan perbandingan string (case-insensitive)

```sql
USE umatis_stokbarang;
```
**Penjelasan:** Memilih database yang akan digunakan untuk perintah-perintah selanjutnya.

### Tabel Profiles

```sql
CREATE TABLE IF NOT EXISTS profiles (
  id VARCHAR(50) PRIMARY KEY,        -- Kolom ID, tipe string max 50 karakter, sebagai kunci utama
  full_name VARCHAR(100) NOT NULL,   -- Nama lengkap, wajib diisi (NOT NULL)
  email VARCHAR(100) UNIQUE,         -- Email, harus unik (tidak boleh duplikat)
  password VARCHAR(255) DEFAULT 'demopassword123',  -- Password dengan nilai default
  role ENUM('admin','owner','barista') NOT NULL,     -- Hanya boleh 3 nilai ini
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  -- Otomatis diisi waktu saat ini, dan otomatis update saat data diubah
) ENGINE=InnoDB;
```
**Penjelasan:**
- `PRIMARY KEY` — Nilai unik yang mengidentifikasi setiap baris
- `NOT NULL` — Kolom ini wajib diisi, tidak boleh kosong
- `UNIQUE` — Tidak boleh ada dua baris dengan nilai yang sama
- `ENUM()` — Tipe data yang hanya menerima nilai yang sudah ditentukan
- `DEFAULT` — Nilai otomatis jika tidak diisi
- `ENGINE=InnoDB` — Engine database yang mendukung Foreign Key dan transaksi

### Tabel Items (dengan Foreign Key)

```sql
CREATE TABLE IF NOT EXISTS items (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  category VARCHAR(50) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  current_stock DECIMAL(12,2) DEFAULT 0,    -- Angka desimal, 12 digit total, 2 desimal
  minimum_stock DECIMAL(12,2) DEFAULT 0,
  supplier_id VARCHAR(50) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
  -- ^ Relasi ke tabel suppliers. Jika supplier dihapus, supplier_id jadi NULL
) ENGINE=InnoDB;
```
**Penjelasan:**
- `DECIMAL(12,2)` — Menyimpan angka desimal dengan presisi tinggi (contoh: 4500.00)
- `FOREIGN KEY` — Membuat relasi antar tabel. `supplier_id` di tabel items merujuk ke `id` di tabel suppliers
- `ON DELETE SET NULL` — Jika supplier yang dirujuk dihapus, nilai `supplier_id` otomatis jadi NULL (tidak ikut terhapus)

### Tabel Transactions (dengan CASCADE)

```sql
FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
-- ^ Jika barang dihapus, semua transaksi terkait IKUT TERHAPUS
```
**Penjelasan:** `ON DELETE CASCADE` artinya jika data parent (items) dihapus, semua data child (transactions yang merujuk ke item tersebut) ikut terhapus secara otomatis.

### Seed Data (Data Contoh)

```sql
INSERT INTO profiles (id, full_name, email, password, role) VALUES
  ('usr-admin', 'Budi (Admin Stok)', 'admin@umatis.com', 'demopassword123', 'admin'),
  ('usr-owner', 'Santi (Owner Umatis)', 'owner@umatis.com', 'demopassword123', 'owner'),
  ('usr-barista', 'Gede (Senior Barista)', 'barista@umatis.com', 'demopassword123', 'barista');
```
**Penjelasan:** `INSERT INTO ... VALUES` memasukkan data ke tabel. Ini adalah data contoh agar aplikasi langsung bisa digunakan setelah setup.

---

# 7. Styling (globals.css)

## `src/app/globals.css` — Tema Visual

```css
@import "tailwindcss";
```
**Baris 1:** Mengimpor semua utility class Tailwind CSS (seperti `text-xs`, `bg-emerald-600`, `rounded-xl`, dll).

### Custom Theme

```css
@theme {
  --color-forest-dark: #022c22;      /* Warna hijau tua gelap (background utama) */
  --color-forest-medium: #064e3b;    /* Hijau medium */
  --color-forest-light: #0f766e;     /* Hijau terang */
  --color-forest-accent: #10b981;    /* Hijau aksen (emerald) */
  --color-gold-accent: #d4af37;      /* Warna emas untuk aksen premium */
  --color-glass-bg: rgba(6, 78, 59, 0.15);      /* Background transparan untuk efek kaca */
  --color-glass-border: rgba(255, 255, 255, 0.08); /* Border tipis semi-transparan */
  --font-sans: var(--font-plus-jakarta-sans), ...;  /* Font utama: Plus Jakarta Sans */
}
```
**Penjelasan:** `@theme` di Tailwind CSS 4 mendefinisikan custom design tokens. Warna-warna ini bisa dipakai sebagai class Tailwind, contoh: `bg-forest-dark`.

### Background Gradient

```css
body {
  background-color: #022c22;
  background-image: 
    radial-gradient(at 0% 0%, rgba(6, 78, 59, 0.6) 0px, transparent 50%),
    radial-gradient(at 100% 0%, rgba(15, 118, 110, 0.4) 0px, transparent 50%),
    radial-gradient(at 50% 100%, rgba(2, 44, 34, 0.9) 0px, transparent 100%),
    radial-gradient(at 100% 100%, rgba(11, 19, 41, 0.8) 0px, transparent 50%);
  background-attachment: fixed;
}
```
**Penjelasan:** Membuat background gradient radial dari 4 sudut yang berbeda, menciptakan efek "ambient glow" yang premium. `background-attachment: fixed` membuat background tidak ikut scroll.

### Glassmorphism Effect

```css
.glass-panel {
  background: rgba(6, 78, 59, 0.15);          /* Background semi-transparan hijau */
  backdrop-filter: blur(16px);                  /* Efek blur pada elemen di belakangnya */
  -webkit-backdrop-filter: blur(16px);          /* Support untuk Safari */
  border: 1px solid rgba(255, 255, 255, 0.08); /* Border putih sangat tipis */
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.4); /* Shadow gelap di bawah */
}
```
**Penjelasan:** Ini adalah teknik desain **Glassmorphism** — membuat elemen terlihat seperti kaca buram/frosted glass. Digunakan di semua card, header, dan panel di aplikasi.

### Input Styling

```css
.glass-input {
  background: rgba(255, 255, 255, 0.03);    /* Hampir transparan */
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.75rem;                    /* Sudut rounded */
  padding: 0.75rem 1rem;
  color: #f8fafc;                            /* Teks putih */
  transition: all 0.20s ease-in-out;         /* Animasi halus saat fokus */
}

.glass-input:focus {
  background: rgba(255, 255, 255, 0.07);             /* Sedikit lebih terang saat fokus */
  border-color: rgba(16, 185, 129, 0.45);            /* Border hijau emerald */
  box-shadow: 0 0 15px rgba(16, 185, 129, 0.15);    /* Glow hijau */
}
```
**Penjelasan:** `transition` membuat perubahan warna/border terjadi secara animasi halus (0.2 detik), bukan langsung berubah.

---

# 8. Layout (layout.tsx)

## `src/app/layout.tsx` — Layout Utama Aplikasi

```typescript
import type { Metadata } from "next";
```
**Baris 1:** Mengimpor tipe `Metadata` dari Next.js untuk SEO (title, description).

```typescript
import { Plus_Jakarta_Sans } from "next/font/google";
```
**Baris 2:** Mengimpor font **Plus Jakarta Sans** dari Google Fonts. Next.js otomatis mengunduh dan meng-optimize font ini.

```typescript
const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",  // CSS variable untuk referensi font
  subsets: ["latin"],                     // Hanya karakter Latin (hemat ukuran)
  weight: ["300","400","500","600","700","800"],  // Variasi ketebalan font
});
```

```typescript
export const metadata: Metadata = {
  title: "Stokbarang Umatis - Bar Inventory & Stock Opname",
  description: "Aplikasi Manajemen Inventaris Bar...",
};
```
**Penjelasan:** Metadata ini otomatis jadi tag `<title>` dan `<meta description>` di HTML. Penting untuk SEO.

```typescript
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={`${plusJakartaSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans text-slate-100 selection:bg-emerald-800">
        {children}
      </body>
    </html>
  );
}
```
**Penjelasan:**
- `lang="id"` — Memberitahu browser bahwa konten dalam bahasa Indonesia
- `antialiased` — Membuat teks lebih halus/smooth
- `{children}` — Di sinilah konten halaman (Login, Admin, Owner, Barista) akan ditampilkan
- `selection:bg-emerald-800` — Warna highlight saat user menyeleksi teks

---

# 9. Halaman Login

## `src/app/page.tsx` — Halaman Login

```typescript
'use client';
```
**Baris 1:** Menandai file ini sebagai **Client Component** (berjalan di browser). Ini diperlukan karena menggunakan `useState`, `useEffect`, dan event handler yang hanya bisa berjalan di browser.

```typescript
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loginUser } from '@/lib/api-client';
```
**Penjelasan:**
- `useState` — React Hook untuk membuat variabel yang bisa berubah (state)
- `useEffect` — React Hook untuk menjalankan kode saat komponen dimuat
- `useRouter` — Hook Next.js untuk navigasi/redirect halaman
- `loginUser` — Fungsi dari api-client untuk kirim login ke server

### State (Variabel yang Bisa Berubah)

```typescript
const [email, setEmail] = useState('');       // Nilai input email, awalnya kosong
const [password, setPassword] = useState('');  // Nilai input password
const [error, setError] = useState<string | null>(null);  // Pesan error (atau null)
const [loading, setLoading] = useState(false); // Status loading (true/false)
```
**Penjelasan:** `useState` mengembalikan array berisi [nilai, fungsiUntukMengubah]. Contoh: `email` adalah nilai, `setEmail` untuk mengubahnya.

### Clear Session Saat Halaman Dimuat

```typescript
useEffect(() => {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('umatis_user');  // Hapus data user sebelumnya
  }
}, []);
// [] = dependency array kosong = hanya dijalankan SEKALI saat halaman pertama kali dimuat
```

### Fungsi Login

```typescript
const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();       // Mencegah form dari reload halaman (perilaku default HTML)
  setError(null);           // Reset pesan error
  setLoading(true);         // Tampilkan spinner loading

  try {
    const user = await loginUser(email, password);
    // ^ Kirim email & password ke API /api/auth/login
    // Jika berhasil, user berisi { id, email, full_name, role }

    sessionStorage.setItem('umatis_user', JSON.stringify({...}));
    // ^ Simpan data user ke sessionStorage browser (hilang jika tab ditutup)

    setTimeout(() => {
      redirectUser(user.role);  // Redirect setelah 600ms (untuk animasi)
    }, 600);
  } catch (err: any) {
    setError(err.message);     // Tampilkan pesan error
    setLoading(false);
  }
};
```

### Fungsi Redirect Berdasarkan Role

```typescript
const redirectUser = (role: 'admin' | 'owner' | 'barista') => {
  if (role === 'admin') router.push('/admin');
  else if (role === 'owner') router.push('/owner');
  else if (role === 'barista') router.push('/barista');
};
// router.push() = navigasi ke halaman lain tanpa reload
```

### Quick Login (Pengisian Otomatis)

```typescript
const fillQuickLogin = (roleEmail: string) => {
  setEmail(roleEmail);                // Isi email otomatis
  setPassword('demopassword123');     // Isi password demo
  setError(null);                     // Hapus error
};
```

---

# 10. API Routes (Backend)

API Routes di Next.js berjalan di **server** (bukan di browser). Ini yang berkomunikasi langsung dengan MySQL.

## `api/auth/login/route.ts` — API Login

```typescript
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
```
**Penjelasan:**
- `NextRequest` / `NextResponse` — Tipe request/response bawaan Next.js
- `pool` — Connection pool MySQL yang kita buat di `db.ts`
- `RowDataPacket` — Tipe TypeScript untuk hasil query MySQL

```typescript
export async function POST(req: NextRequest) {
```
**Penjelasan:** Mendefinisikan handler untuk **HTTP POST** request. Nama fungsi `POST` = hanya merespons method POST.

```typescript
  const { email, password } = await req.json();
  // ^ Membaca body request dan destructure menjadi variabel email dan password
```

```typescript
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT id, full_name, email, role FROM profiles WHERE email = ? AND password = ?',
    [email, password]
  );
```
**Penjelasan:**
- `pool.query()` — Menjalankan SQL query ke database MySQL
- `?` — **Parameterized query** (prepared statement). Nilai `email` dan `password` dimasukkan secara aman untuk mencegah **SQL Injection**
- `[rows]` — Destructuring hasil query. `rows` berisi array objek hasil SELECT
- `<RowDataPacket[]>` — TypeScript generic untuk type-safety

```typescript
  if (rows.length === 0) {
    return NextResponse.json({ error: 'Email atau password salah.' }, { status: 401 });
    // ^ Status 401 = Unauthorized
  }

  const user = rows[0];  // Ambil user pertama (karena email unique, hanya ada 1)
  return NextResponse.json({
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    role: user.role,
  });
  // ^ Kembalikan data user sebagai JSON response (status 200 default)
```

## `api/items/route.ts` — API Barang (GET & POST)

### GET: Ambil Semua Barang

```typescript
export async function GET() {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT i.*, COALESCE(s.name, 'Tanpa Supplier') as supplier_name 
     FROM items i 
     LEFT JOIN suppliers s ON i.supplier_id = s.id 
     ORDER BY i.name`
  );
  return NextResponse.json(rows);
}
```
**Penjelasan SQL:**
- `SELECT i.*` — Ambil semua kolom dari tabel items (alias `i`)
- `COALESCE(s.name, 'Tanpa Supplier')` — Jika `s.name` NULL, gunakan 'Tanpa Supplier'
- `LEFT JOIN suppliers s ON i.supplier_id = s.id` — Gabungkan data dari tabel suppliers berdasarkan `supplier_id`. LEFT JOIN artinya: tampilkan semua items, meskipun tidak punya supplier
- `ORDER BY i.name` — Urutkan berdasarkan nama (A-Z)

### POST: Simpan Barang (Create / Update)

```typescript
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { id, name, category, unit, current_stock, minimum_stock, supplier_id } = body;

  if (id) {
    // Jika ada ID = UPDATE barang yang sudah ada
    await pool.query(
      `UPDATE items SET name = ?, category = ?, unit = ?, 
       minimum_stock = ?, supplier_id = ?, current_stock = ? WHERE id = ?`,
      [name, category, unit, Number(minimum_stock), supplier_id || null, Number(current_stock), id]
    );
  } else {
    // Jika tidak ada ID = INSERT barang baru
    const newId = `itm-${Date.now()}`;  // Generate ID unik berdasarkan timestamp
    await pool.query(
      'INSERT INTO items (id, name, category, unit, current_stock, minimum_stock, supplier_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [newId, name, category, unit, Number(current_stock), Number(minimum_stock), supplier_id || null]
    );
  }
}
```
**Penjelasan:** Satu endpoint POST menangani dua kasus: **create** (jika tidak ada ID) dan **update** (jika ada ID).

## `api/transactions/route.ts` — API Transaksi

### POST: Buat Transaksi + Update Stok Otomatis

```typescript
// Insert record transaksi
await pool.query(
  'INSERT INTO transactions (id, item_id, type, quantity, actor_id, notes) VALUES (?, ?, ?, ?, ?, ?)',
  [newId, item_id, type, qty, actor_id, notes]
);

// Update stok barang secara otomatis
if (type === 'masuk') {
  await pool.query(
    'UPDATE items SET current_stock = current_stock + ? WHERE id = ?',
    [qty, item_id]
  );
  // current_stock = current_stock + qty → Stok bertambah
} else {
  await pool.query(
    'UPDATE items SET current_stock = current_stock - ? WHERE id = ?',
    [qty, item_id]
  );
  // current_stock = current_stock - qty → Stok berkurang
}
```
**Penjelasan:** Setiap kali transaksi dibuat, stok barang otomatis diupdate. Jika tipe `masuk` → stok bertambah. Jika `keluar` atau `terpakai` → stok berkurang.

## `api/suppliers/[id]/route.ts` — Dynamic Route

```typescript
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // ^ [id] di nama folder menjadi parameter dinamis
  // Contoh: DELETE /api/suppliers/sup-1 → id = "sup-1"

  await pool.query('DELETE FROM suppliers WHERE id = ?', [id]);
  return NextResponse.json({ success: true });
}
```
**Penjelasan:** Folder `[id]` di Next.js berarti **dynamic route** — bagian URL yang bisa berubah-ubah. Nilainya diakses melalui `params`.

---

# 11. Halaman Admin

## `src/app/admin/page.tsx` — Dashboard Admin (CRUD Lengkap)

### Pengecekan Autentikasi

```typescript
useEffect(() => {
  if (typeof window !== 'undefined') {
    const userStr = sessionStorage.getItem('umatis_user');
    // ^ Ambil data user dari sessionStorage

    if (!userStr) {
      router.push('/');  // Jika tidak ada → redirect ke login
      return;
    }

    const user = JSON.parse(userStr);  // Parse string JSON jadi objek
    if (user.role !== 'admin') {
      // Jika bukan admin → tendang ke halaman sesuai role-nya
      if (user.role === 'owner') router.push('/owner');
      else if (user.role === 'barista') router.push('/barista');
      else router.push('/');
      return;
    }
    setCurrentUser(user);
  }
  loadData();  // Muat semua data dari database
}, [router]);
```
**Penjelasan:** `useEffect` ini berjalan saat halaman dimuat. Fungsinya: (1) cek apakah user sudah login, (2) cek apakah role-nya admin, (3) jika iya, muat data.

### Load Data Paralel

```typescript
const loadData = async () => {
  setLoading(true);
  try {
    const [profilesData, suppliersData, itemsData, txData] = await Promise.all([
      api.getProfiles(),      // Fetch profiles
      api.getSuppliers(),     // Fetch suppliers
      api.getItems(),         // Fetch items
      api.getTransactions(),  // Fetch transactions
    ]);
    // Promise.all() menjalankan SEMUA fetch secara BERSAMAAN (paralel)
    // Lebih cepat daripada menjalankan satu per satu

    setProfiles(profilesData);
    setSuppliers(suppliersData);
    setItems(itemsData);
    setTransactions(txData);
  } catch (err) {
    console.error("Error loading data", err);
  } finally {
    setLoading(false);  // finally = selalu dijalankan, baik sukses maupun error
  }
};
```

### Metrik Dashboard

```typescript
const totalItems = items.length;              // Jumlah total bahan
const lowStockItems = items.filter(           // Filter barang stok tipis
  item => item.current_stock < item.minimum_stock
);
const totalSuppliers = suppliers.length;
const transactionsToday = transactions.filter(tx => {
  const today = new Date().toISOString().split('T')[0];  // Format: "2026-06-09"
  return tx.created_at.startsWith(today);                 // Cocokkan tanggal hari ini
}).length;
```

### Tab Navigation

Admin dashboard memiliki 4 tab: **Bahan Bar**, **Supplier**, **Riwayat Transaksi**, **Daftar Pengguna**. State `activeTab` menentukan tab mana yang aktif:

```typescript
const [activeTab, setActiveTab] = useState<'items' | 'suppliers' | 'transactions' | 'users'>('items');
// Default tab = 'items'
```

### CRUD Item (Contoh Save)

```typescript
const handleSaveItem = async (e: React.FormEvent) => {
  e.preventDefault();  // Cegah form dari reload halaman

  await api.saveItem({
    id: currentItem.id || undefined,  // Jika ada ID = update, jika undefined = create baru
    name: currentItem.name,
    category: currentItem.category,
    unit: currentItem.unit,
    minimum_stock: Number(currentItem.minimum_stock || 0),
    supplier_id: currentItem.supplier_id || null,
    current_stock: Number(currentItem.current_stock || 0),
  });

  setItemModalOpen(false);   // Tutup modal
  setCurrentItem(null);      // Reset form
  loadData();                // Refresh data dari database
};
```

---

# 12. Halaman Owner

## `src/app/owner/page.tsx` — Dashboard Monitoring & Export

### Fitur Utama:
1. **Kondisi Inventaris Real-Time** — Alert jika ada stok kritis
2. **Volume Bahan per Kategori** — Chart visual per kategori
3. **Pusat Ekspor Laporan (CSV)** — Download data ke file CSV
4. **Daftar Barang Stok Kritis** — Tabel barang di bawah minimum
5. **5 Aktivitas Mutasi Terakhir** — Log transaksi terbaru

### Logika Stok Kritis

```typescript
const lowStockCount = items.filter(
  item => item.current_stock < item.minimum_stock
).length;
// Hitung berapa banyak barang yang stoknya di bawah batas minimum
```

### Chart Kategori

```typescript
const categories = Array.from(new Set(items.map(i => i.category)));
// Set = menghilangkan duplikat. Jadi dari semua item, ambil kategori unik saja
// Contoh hasil: ['Coffee', 'Syrup', 'Dairy', 'Garnish']

const categoryData = categories.map(cat => {
  const total = items
    .filter(i => i.category === cat)              // Filter item per kategori
    .reduce((sum, item) => sum + Number(item.current_stock), 0);  // Jumlahkan stok
  return { name: cat, value: total };
}).sort((a, b) => b.value - a.value);  // Urutkan dari terbesar ke terkecil
```

### Export CSV

```typescript
const downloadCSV = (filename: string, headers: string[], rows: string[][]) => {
  const csvContent = [
    headers.join(','),          // Baris pertama = header kolom
    ...rows.map(row =>          // Setiap baris data
      row.map(cell => {
        const clean = cell ? cell.toString().replace(/"/g, '""') : '';
        // ^ Escape tanda kutip ganda (CSV standard)
        return clean.includes(',') ? `"${clean}"` : clean;
        // ^ Jika sel mengandung koma, bungkus dengan tanda kutip
      }).join(',')
    )
  ].join('\n');   // Gabungkan semua baris dengan newline

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  // ^ Blob = objek binary yang merepresentasikan file

  const url = URL.createObjectURL(blob);   // Buat URL sementara untuk file
  const link = document.createElement('a'); // Buat elemen <a> tersembunyi
  link.setAttribute('href', url);
  link.setAttribute('download', filename); // Set nama file download
  link.click();                            // Klik otomatis → trigger download
  document.body.removeChild(link);         // Bersihkan elemen
};
```

---

# 13. Halaman Barista

## `src/app/barista/page.tsx` — Stock Opname Wizard

### Fitur Utama:
1. **Katalog Bahan** — Grid kartu bahan dengan tombol "Audit"
2. **Stock Opname Wizard** — Modal 2 langkah untuk input stok fisik
3. **Audit Log Hari Ini** — Tabel opname yang sudah dilakukan hari ini

### Wizard Flow

```
Klik "Audit" → Step 2: Input jumlah fisik → Step 3: Sukses!
```

### Mulai Opname

```typescript
const startOpname = (item: Item) => {
  setSelectedItem(item);       // Simpan item yang dipilih
  setPhysicalStock('');        // Reset input stok fisik
  setOpnameNotes('');          // Reset catatan
  setWizardStep(2);            // Langsung ke step 2 (input)
  setWizardOpen(true);         // Buka modal wizard
};
```

### Simpan Opname

```typescript
const handleSaveOpname = async () => {
  const physical = Number(physicalStock);       // Stok fisik yang dihitung
  const system = Number(selectedItem.current_stock);  // Stok di sistem

  await api.addOpname({
    item_id: selectedItem.id,
    system_stock: system,
    physical_stock: physical,
    status: 'verified',          // Langsung verified
    barista_id: currentUser.id,
    notes: opnameNotes,
  });
  // Server otomatis menghitung discrepancy (selisih) dan update stok

  setWizardStep(3);   // Tampilkan layar sukses
  loadData();         // Refresh data
};
```

### Filter Opname Hari Ini

```typescript
const todayStr = new Date().toISOString().split('T')[0];  // "2026-06-09"
const todayOpnames = opnameHistory.filter(
  op => op.created_at.startsWith(todayStr)
  // ^ Hanya tampilkan opname yang created_at dimulai dengan tanggal hari ini
);
```

---

# 14. Komponen Mock Warning

## `src/components/mock-warning.tsx` — Banner Status Database

```typescript
const [dbConnected, setDbConnected] = useState<boolean | null>(null);
// null = belum dicek, true = terhubung, false = tidak terhubung

useEffect(() => {
  checkDbConnection().then(setDbConnected);
  // Saat komponen dimuat, cek koneksi ke MySQL via API
}, []);

if (dbConnected === null) return null;  // Jangan tampilkan apa-apa saat masih loading
```

**Jika terhubung:** Tampilkan banner hijau "MySQL Database Terhubung"
**Jika tidak terhubung:** Tampilkan banner kuning "Database Tidak Terhubung" + tombol bantuan setup

---

# 15. Alur Kerja Aplikasi

## Arsitektur Keseluruhan

```
┌─────────────────────┐
│  Browser (React)    │  ← Halaman Login, Admin, Owner, Barista
│  Client Component   │
└──────────┬──────────┘
           │ fetch('/api/...')
           ▼
┌─────────────────────┐
│  Next.js API Routes │  ← Server-side (Node.js)
│  Route Handlers     │  ← File: src/app/api/.../route.ts
└──────────┬──────────┘
           │ pool.query()
           ▼
┌─────────────────────┐
│  MySQL Database     │  ← XAMPP / phpMyAdmin
│  umatis_stokbarang  │  ← 5 tabel: profiles, suppliers, items,
└─────────────────────┘    transactions, stock_opname
```

## Alur Login

```
1. User masukkan email + password
2. Frontend → POST /api/auth/login { email, password }
3. API Route → SELECT dari MySQL WHERE email=? AND password=?
4. Jika cocok → Return { id, full_name, role }
5. Frontend simpan ke sessionStorage
6. Redirect ke /admin, /owner, atau /barista sesuai role
```

## Alur CRUD (Contoh: Tambah Barang)

```
1. Admin klik "Tambah Bahan" → Modal terbuka
2. Admin isi form (nama, kategori, unit, stok, supplier)
3. Klik "Simpan" → api.saveItem({...})
4. api-client → POST /api/items { name, category, ... }
5. API Route → INSERT INTO items (...) VALUES (...)
6. Data masuk ke MySQL → Return data baru
7. Frontend panggil loadData() → Refresh tampilan tabel
```

## Alur Stock Opname

```
1. Barista pilih bahan → Klik "Audit"
2. Wizard terbuka → Input jumlah fisik + catatan
3. Klik "Simpan Hasil"
4. api.addOpname({ system_stock, physical_stock, ... })
5. API Route:
   a. INSERT INTO stock_opname (selisih dihitung otomatis)
   b. UPDATE items SET current_stock = physical_stock
   c. INSERT INTO transactions (adjustment otomatis)
6. Data tersimpan di MySQL
7. Frontend refresh → Tampilkan di audit log hari ini
```

---

# Ringkasan Teknologi

| Komponen | Teknologi | Penjelasan |
|---|---|---|
| Frontend | React + Next.js | Library UI + framework full-stack |
| Styling | Tailwind CSS + Custom CSS | Utility classes + glassmorphism |
| Backend | Next.js API Routes | Server-side route handlers |
| Database | MySQL (phpMyAdmin) | Database relasional via XAMPP |
| Koneksi DB | mysql2/promise | Connection pool async |
| Bahasa | TypeScript | JavaScript + type-safety |
| Font | Plus Jakarta Sans | Google Fonts (modern sans-serif) |
| Ikon | Lucide React | Library ikon SVG modern |
| State Mgmt | React useState/useEffect | Built-in React hooks |
| Auth | SessionStorage | Penyimpanan sesi sementara di browser |

---

# 16. Landasan Teori & Daftar Pustaka

## Landasan Teori Pengembangan Sistem

Aplikasi **Stokbarang Umatis** dirancang berdasarkan beberapa teori utama di bidang Rekayasa Perangkat Lunak, Manajemen Operasional, dan Sistem Basis Data:

1. **Konsep Manajemen Inventaris & Batas Minimum Stok (Safety Stock)**
   - Sistem ini menerapkan konsep *Reorder Point* (ROP) dan *Safety Stock* (stok pengaman). Nilai `minimum_stock` pada tabel barang digunakan sebagai pemicu alarm (*alert*) jika stok riil (`current_stock`) berada di bawah batas aman. Teori ini berpatokan pada manajemen rantai pasokan (*supply chain*) untuk menghindari kehabisan bahan baku (*stockout*).

2. **Prosedur Audit Inventaris Fisik (Stock Opname)**
   - Proses rekonsiliasi berkala dilakukan melalui pencocokan stok fisik (`physical_stock`) oleh Barista dengan stok sistem (`system_stock`). Selisih yang ditemukan (`discrepancy`) dianalisis untuk mendeteksi kehilangan barang, kerusakan, atau kebocoran stok. Transaksi penyesuaian (*adjustment*) dicatat secara otomatis untuk menjaga integritas data keuangan dan operasional.

3. **Arsitektur Relasional Basis Data (RDBMS)**
   - Skema basis data MySQL dirancang menggunakan aturan normalisasi (meminimalkan redundansi data) dan integritas referensial. Penerapan *Foreign Key* dengan aturan `ON DELETE CASCADE` dan `ON DELETE SET NULL` memastikan bahwa hubungan antar-tabel (seperti barang dengan supplier atau barang dengan transaksi) tetap konsisten tanpa menyisakan data yatim (*orphan data*).

4. **Arsitektur Web Client-Server & REST API**
   - Pemisahan tanggung jawab (*separation of concerns*) diimplementasikan menggunakan arsitektur modular Next.js. Halaman frontend bertindak sebagai Client yang berinteraksi dengan API backend melalui *fetch request* JSON asynchronous. Keamanan data dan logika penulisan database dikelola sepenuhnya oleh API Route di sisi server.

5. **Role-Based Access Control (RBAC)**
   - Pembagian hak akses pengguna (*authorization*) disesuaikan dengan peran kerja organisasi: **Admin** (kontrol penuh/CRUD data master), **Barista** (input operasional harian/opname), dan **Owner** (pemantauan strategis dan pelaporan). Hal ini mengikuti prinsip keamanan *Least Privilege* (hak akses minimal).

---

## Daftar Pustaka (Referensi Akademik)

Berikut adalah referensi buku teks akademis dan standar industri yang menjadi patokan dalam pengembangan aplikasi ini:

* **Heizer, J., Render, B., & Munson, C. (2020).** *Operations Management: Sustainability and Supply Chain Management (13th ed.)*. Pearson.
  * *Patokan untuk:* Konsep manajemen inventaris, perhitungan stok minimum, dan prosedur audit inventaris fisik.
* **Elmasri, R., & Navathe, S. B. (2016).** *Fundamentals of Database Systems (7th ed.)*. Pearson.
  * *Patokan untuk:* Desain basis data relasional, pemodelan tabel MySQL, relasi antar-tabel (*Foreign Key*), integritas data, dan normalisasi.
* **Pressman, R. S., & Maxim, B. R. (2020).** *Software Engineering: A Practitioner's Approach (9th ed.)*. McGraw-Hill Education.
  * *Patokan untuk:* Pengembangan sistem terstruktur, analisis kebutuhan pengguna, pemodelan alur kerja (*use case*), dan desain hak akses (*authorization*).
* **Flanagan, D. (2020).** *JavaScript: The Definitive Guide (7th ed.)*. O'Reilly Media.
  * *Patokan untuk:* Pemrograman logika berbasis TypeScript, asynchronous operations (async/await), dan *fetch request* REST API.
* **Nielsen, J. (1994).** *Usability Engineering*. Academic Press.
  * *Patokan untuk:* Prinsip desain antarmuka pengguna (UI/UX) responsif, navigasi tab, pemuatan visual (*loading states*), dan umpan balik kesalahan (*error handling*).
* **Vercel / Next.js Documentation. (2026).** *Next.js App Router Architecture and Server Actions*. Diambil dari nextjs.org/docs.
  * *Patokan untuk:* Konsep *hybrid web application*, pembuatan API routes, static generation, dan routing dinamis.

---

*Dokumentasi ini dibuat untuk keperluan presentasi mata kuliah Semester 6.*
*Aplikasi: Stokbarang Umatis — Manajemen Inventaris Bar & Stock Opname*
