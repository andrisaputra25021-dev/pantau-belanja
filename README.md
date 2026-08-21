# PantauBelanja

Aplikasi pencatat pengeluaran harian berbasis web, dirancang mobile-first untuk pengguna non-tech-savvy. Membantu mencatat pemasukan/pengeluaran, mengelompokkan transaksi per kategori, dan melihat rekap bulanan tanpa proses yang rumit.

🔗 Live demo: [pantau-belanja.vercel.app](https://pantau-belanja.vercel.app/)

## Fitur

- Autentikasi pengguna (register/login)
- Catat transaksi pemasukan dan pengeluaran
- Kategori transaksi otomatis
- Rekap bulanan per kategori
- Desain responsif, dioptimalkan untuk mobile (375px)

## Tech Stack

- **Frontend:** React + Vite
- **Styling:** Tailwind CSS
- **Routing:** React Router
- **Backend & Database:** Supabase (PostgreSQL, Auth, Row Level Security)
- **Deployment:** Vercel

## Menjalankan Secara Lokal

Clone repository ini:

```bash
git clone https://github.com/andrisaputra25021-dev/pantau-belanja.git
cd pantau-belanja
```

Install dependencies:

```bash
npm install
```

Buat file `.env` di root project, isi dengan kredensial Supabase milikmu sendiri:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

Jalankan development server:

```bash
npm run dev
```

Aplikasi akan berjalan di `http://localhost:5173`.

## Catatan Pengembangan

Dibangun dengan pendekatan MVP — fitur diprioritaskan berdasarkan kebutuhan inti pengguna, dengan beberapa fitur (seperti notifikasi budget limit dan export laporan) sengaja ditunda untuk versi berikutnya.

## Author

Andri Saputra
