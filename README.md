# Sistem Pemilihan OSIS

Aplikasi web pemungutan suara Ketua & Wakil OSIS berbasis Next.js 15 yang dirancang generik untuk sekolah apapun. Nama sekolah, logo, deskripsi, dan footer dapat diatur sepenuhnya dari panel admin tanpa menyentuh kode.

Berjalan mandiri tanpa layanan cloud pihak ketiga: database SQLite lokal, autentikasi JWT via cookie httpOnly, dan penyimpanan foto kandidat di filesystem. Cocok dijalankan di jaringan sekolah, laptop panitia, maupun VPS internal.

Dikembangkan dan dipelihara oleh **JZPedia**.

---

## Daftar Isi

1. [Ringkasan](#ringkasan)
2. [Prasyarat](#prasyarat)
3. [Cara Menjalankan](#cara-menjalankan)
4. [Konfigurasi Environment](#konfigurasi-environment)
5. [Branding Sekolah](#branding-sekolah)
6. [Struktur Proyek](#struktur-proyek)
7. [Alur Pemakaian](#alur-pemakaian)
8. [Skema Database](#skema-database)
9. [API Endpoint](#api-endpoint)
10. [Autentikasi & Session](#autentikasi--session)
11. [Tech Stack](#tech-stack)
12. [Fitur](#fitur)
13. [Keamanan](#keamanan)
14. [Deployment](#deployment)
15. [Troubleshooting](#troubleshooting)
16. [Kontak & Lisensi](#kontak--lisensi)

---

## Ringkasan

Sistem ini menggantikan pemilihan konvensional (kertas suara) dengan pemungutan digital yang:

- Mencegah suara ganda di level database (primary key pada `user_id` tabel `votes`).
- Membatasi pendaftaran hanya untuk NIS yang sudah diverifikasi admin (whitelist).
- Menampilkan hasil voting real-time dengan grafik untuk panitia.
- Menyimpan seluruh data di satu file SQLite yang mudah dibackup.
- Dapat dipakai lintas sekolah — semua identitas visual bersifat konfigurasi, bukan hardcode.

Arsitektur single-process: frontend, backend, dan database berjalan di satu instance Next.js.

---

## Prasyarat

| Kebutuhan | Versi minimum | Keterangan |
|---|---|---|
| Node.js | 18.17 atau lebih baru | LTS direkomendasikan (20.x / 22.x) |
| npm | 9 | atau pnpm/yarn setara |
| Sistem operasi | Linux, macOS, Windows | `better-sqlite3` butuh compile toolchain saat install pertama |
| Ruang disk | ~200 MB | untuk node_modules + database awal |

Untuk Windows, pastikan `windows-build-tools` atau Visual Studio Build Tools terpasang agar `better-sqlite3` bisa di-compile.

---

## Cara Menjalankan

Ikuti langkah berikut secara berurutan.

### 1. Clone dan install dependency

```bash
git clone https://github.com/Personaldycoders/pemilihan-osis
cd pemilihan-osis
npm install
```

### 2. Buat file `.env.local`

Salin template di bawah ke root project sebagai `.env.local`, lalu isi nilainya.

```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD=123456
ADMIN_NAMA=Administrator OSIS
JWT_SECRET=ganti-dengan-string-acak-minimal-32-karakter
```

Generate `JWT_SECRET` yang aman:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

### 3. Jalankan development server

```bash
npm run dev
```

Buka `http://localhost:3000`. Saat pertama kali dijalankan, aplikasi akan:

1. Membuat folder `data/` dan file `data/app.db`.
2. Membuat skema tabel (users, students, candidates, votes, settings).
3. Seed 1 admin default dari nilai di `.env.local`.

### 4. Login admin dan siapkan branding

Login dengan kredensial admin (default `admin` / `admin123`), lalu:

1. Buka tab **Pengaturan** → isi nama sekolah, singkatan, deskripsi landing, footer, dan unggah logo.
2. Buka tab **Kelola Siswa** → import NIS peserta (manual atau CSV bulk).
3. Buka tab **Kelola Kandidat** → tambah pasangan calon beserta visi, misi, dan foto.
4. Bagikan link `http://<ip-server>:3000` ke siswa untuk mendaftar dan memilih.

### 5. Build untuk production

```bash
npm run build
npm run start
```

Server production berjalan default di port 3000. Ubah dengan `PORT=8080 npm run start`.

### Daftar script

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Dev server dengan hot reload |
| `npm run build` | Build production ke `.next/` |
| `npm run start` | Jalankan hasil build |
| `npm run lint` | ESLint untuk `app/` dan `src/` |

---

## Konfigurasi Environment

Semua variabel dibaca dari `.env.local`.

| Variabel | Wajib | Default | Keterangan |
|---|---|---|---|
| `JWT_SECRET` | ya | — | String acak ≥ 32 karakter. Jangan commit ke git. |
| `ADMIN_USERNAME` | ya | — | Username admin awal (seed sekali di boot pertama). |
| `ADMIN_PASSWORD` | ya | — | Password admin awal. Ubah setelah login pertama. |
| `ADMIN_NAMA` | tidak | `Administrator` | Nama tampilan admin default. |
| `PORT` | tidak | `3000` | Port HTTP saat `npm run start`. |
| `NODE_ENV` | tidak | dev di `npm run dev` | Diset otomatis oleh Next.js. |

Setelah admin pertama di-seed, mengganti `ADMIN_PASSWORD` di `.env.local` tidak mengubah password di DB. Reset lewat UI atau hapus row di `users`.

---

## Branding Sekolah

Identitas visual bersifat generik — tidak ada nama sekolah yang hardcode di kode aplikasi. Semua di-load dari tabel `settings` di database dan bisa diedit dari **Panel Pengaturan** admin:

| Field | Contoh isian | Dipakai di |
|---|---|---|
| `school_name` | `SMA Negeri 1 Jakarta` | Judul halaman, footer, meta OpenGraph |
| `short_name` | `Pemilihan OSIS 2026` | Heading utama landing dan login |
| `logo_url` | Upload gambar dari admin | Header, landing, login, favicon browser |
| `landing_description` | Paragraf sambutan pemilihan | Body landing page |
| `footer_text` | Placeholder `{year}` diganti tahun berjalan | Footer semua halaman |

Favicon browser otomatis mengikuti logo yang di-upload admin (dengan cache-busting), jadi tab browser langsung menampilkan logo sekolah begitu diganti — tidak perlu edit file `public/`.

Nilai default sengaja generik, sehingga aplikasi bisa langsung dipakai sekolah manapun dengan hanya mengubah isian di panel admin.

---

## Struktur Proyek

```
pemilihan-osis/
├── app/                              Next.js App Router (server + client)
│   ├── layout.tsx                    Root layout, provider global, meta dinamis
│   ├── page.tsx                      Landing page publik (list kandidat)
│   ├── login/
│   │   ├── page.tsx                  Route login
│   │   └── LoginPageClient.tsx       Client wrapper
│   ├── dashboard/
│   │   ├── page.tsx                  Route dashboard (dispatch admin/user)
│   │   └── DashboardClient.tsx       Client wrapper
│   ├── robots.ts                     robots.txt generator
│   ├── sitemap.ts                    sitemap.xml generator
│   └── api/                          Route handlers (backend)
│       ├── auth/
│       │   ├── login/route.ts        POST — login
│       │   ├── logout/route.ts       POST — hapus cookie
│       │   ├── me/route.ts           GET — profil user
│       │   └── signup/route.ts       POST — daftar voter (validasi NIS)
│       ├── candidates/
│       │   ├── route.ts              GET list, POST tambah
│       │   └── [id]/route.ts         PUT update, DELETE hapus
│       ├── students/
│       │   ├── route.ts              GET list, POST tambah 1
│       │   ├── bulk/route.ts         POST import CSV
│       │   └── [nis]/route.ts        DELETE hapus 1 NIS
│       ├── users/admin/route.ts      POST tambah admin
│       ├── voters/route.ts           GET daftar pemilih + status
│       ├── settings/                 GET/PUT branding sekolah
│       └── votes/
│           ├── route.ts              POST submit vote
│           ├── results/route.ts      GET hasil + persentase
│           └── reset/route.ts        DELETE reset semua vote
├── src/
│   ├── components/
│   │   ├── LoginPage.tsx             Form login/daftar (tabs)
│   │   ├── UserDashboard.tsx         Dashboard voter
│   │   ├── AdminDashboard.tsx        Dashboard admin (multi-tab)
│   │   ├── CandidateCard.tsx         Kartu kandidat + tombol vote
│   │   ├── CandidateManagement.tsx   CRUD kandidat
│   │   ├── StudentManagement.tsx     Whitelist NIS + bulk import
│   │   ├── VoteResults.tsx           Grafik + tabel hasil
│   │   ├── VotersList.tsx            Tabel status pemilih
│   │   ├── SettingsPanel.tsx         Panel branding
│   │   ├── BrandingProvider.tsx      Context branding
│   │   ├── AnimatedBackground.tsx    Background gradient animasi
│   │   ├── SiteFooter.tsx            Footer bersama
│   │   ├── ThemeProvider.tsx         Dark/light mode
│   │   └── ui/                       ShadCN UI primitives
│   ├── lib/
│   │   ├── auth.ts                   JWT sign/verify + helper session
│   │   ├── db.ts                     better-sqlite3 setup + migrations
│   │   ├── candidates.ts             Query kandidat + upload foto
│   │   └── settings.ts               Baca/simpan branding sekolah
│   └── styles/
│       └── globals.css               Tailwind + tema + animasi
├── data/
│   ├── app.db                        SQLite database (auto-generate)
│   ├── app.db-wal, app.db-shm        File WAL SQLite
│   └── siswa-contoh.csv              Contoh format import NIS
├── public/
│   ├── cendekia.svg                  Logo placeholder default
│   └── uploads/
│       ├── branding/                 Logo hasil upload admin
│       └── candidates/               Foto kandidat
├── .env.local                        Environment (jangan di-commit)
├── next.config.mjs
├── tsconfig.json
└── package.json
```

---

## Alur Pemakaian

### Alur admin (persiapan)

1. Login sebagai admin (`admin` / `admin123` default).
2. Ganti password lewat menu profil.
3. Buka tab **Pengaturan**:
   - Isi nama sekolah, singkatan, deskripsi landing, dan footer.
   - Upload logo sekolah (PNG/SVG/JPG, maks. 2 MB disarankan).
   - Favicon browser otomatis ikut berubah.
4. Buka tab **Kelola Siswa**:
   - Klik **Bulk Import** untuk unggah CSV, atau
   - Klik **Tambah Siswa** untuk memasukkan satu per satu.
5. Buka tab **Kelola Kandidat**:
   - Klik **Tambah Kandidat**, isi nomor urut, nama ketua & wakil, visi, misi.
   - Unggah foto (opsional). Ukuran disarankan ≤ 500 KB.
6. Umumkan pembukaan voting ke siswa.

### Alur voter (siswa)

1. Buka `http://<ip-server>:3000`, klik **Login untuk Memilih**.
2. Pilih tab **Daftar**, isi NIS + username + password.
3. Jika NIS tidak terdaftar, hubungi panitia admin.
4. Setelah daftar, otomatis login → dashboard voter.
5. Pilih pasangan calon → klik **Pilih** → konfirmasi.
6. Suara tercatat. Tombol vote dinonaktifkan (1x per user).

### Alur monitoring (admin)

1. Tab **Hasil Voting** — grafik bar & pie real-time.
2. Tab **Daftar Pemilih** — filter berdasarkan status sudah/belum vote.
3. Selesai pemilihan → screenshot hasil atau export DB.
4. **Reset Voting** (opsional) — butuh 2x konfirmasi, hanya untuk uji coba.

---

## Skema Database

Database dibuat otomatis pada boot pertama. File tersimpan di `data/app.db` dengan mode WAL untuk performa concurrent read.

### Tabel `users`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | TEXT PK | Prefix `usr_` + hex random |
| `username` | TEXT UNIQUE | Case-sensitive |
| `password_hash` | TEXT | bcryptjs, salt rounds 10 |
| `role` | TEXT | `admin` atau `user` |
| `nama_lengkap` | TEXT | Diisi dari whitelist NIS untuk voter |
| `kelas` | TEXT | Diisi dari whitelist NIS untuk voter |
| `sudah_vote` | INTEGER | 0 (belum) / 1 (sudah) |
| `voted_at` | TEXT | ISO timestamp, nullable |
| `created_at` | TEXT | default `datetime('now')` |

### Tabel `students` — whitelist NIS

| Kolom | Tipe | Keterangan |
|---|---|---|
| `nis` | TEXT PK | Nomor Induk Siswa |
| `nama_lengkap` | TEXT | Otomatis dipakai saat signup |
| `kelas` | TEXT | Otomatis dipakai saat signup |
| `created_at` | TEXT | |

Signup akan gagal jika NIS tidak ada di tabel ini.

### Tabel `candidates`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | TEXT PK | `cand_<timestamp>_<hex>` |
| `nomor_urut` | INTEGER | Urutan tampilan |
| `nama_ketua` | TEXT | |
| `nama_wakil` | TEXT | |
| `visi` | TEXT | |
| `misi` | TEXT | Multi-line |
| `foto_path` | TEXT | Nama file di `public/uploads/candidates/`, nullable |
| `created_at` | TEXT | |

### Tabel `votes`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `user_id` | TEXT PK | FK → `users.id`, mencegah suara ganda di level DB |
| `candidate_id` | TEXT | FK → `candidates.id` |
| `created_at` | TEXT | Waktu vote |

### Tabel `settings`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `key` | TEXT PK | Contoh: `school_name`, `logo_path`, `theme` |
| `value` | TEXT | Nilai string |
| `updated_at` | TEXT | Timestamp update terakhir |

Digunakan untuk menyimpan nama sekolah, logo, deskripsi landing, footer, dan tema default.

---

## API Endpoint

Semua response berformat JSON. Autentikasi memakai cookie `osis_session` — tidak perlu header `Authorization` manual.

### Auth

| Method | Path | Akses | Deskripsi |
|---|---|---|---|
| POST | `/api/auth/signup` | Publik | Daftar voter (validasi NIS whitelist) |
| POST | `/api/auth/login` | Publik | Login dengan username + password |
| POST | `/api/auth/logout` | Publik | Hapus cookie session |
| GET | `/api/auth/me` | Login | Profil user aktif |

### Kandidat

| Method | Path | Akses | Deskripsi |
|---|---|---|---|
| GET | `/api/candidates` | Publik | List semua kandidat + `vote_count` |
| POST | `/api/candidates` | Admin | Tambah kandidat (multipart, foto opsional) |
| PUT | `/api/candidates/[id]` | Admin | Update data kandidat |
| DELETE | `/api/candidates/[id]` | Admin | Hapus kandidat + foto |

### Siswa (whitelist NIS)

| Method | Path | Akses | Deskripsi |
|---|---|---|---|
| GET | `/api/students` | Admin | List NIS + status sudah_registered |
| POST | `/api/students` | Admin | Tambah 1 NIS manual |
| POST | `/api/students/bulk` | Admin | Import CSV `NIS,Nama,Kelas` |
| DELETE | `/api/students/[nis]` | Admin | Hapus 1 NIS |

### Users

| Method | Path | Akses | Deskripsi |
|---|---|---|---|
| POST | `/api/users/admin` | Admin | Tambah admin baru |

### Voting

| Method | Path | Akses | Deskripsi |
|---|---|---|---|
| POST | `/api/votes` | Voter | Submit vote (1x per user) |
| GET | `/api/votes/results` | Publik | Hasil + persentase |
| DELETE | `/api/votes/reset` | Admin | Hapus semua vote (2x konfirmasi di UI) |
| GET | `/api/voters` | Admin | Daftar pemilih + status |

### Settings

| Method | Path | Akses | Deskripsi |
|---|---|---|---|
| GET | `/api/settings` | Publik | Baca branding aktif |
| PUT | `/api/settings` | Admin | Update branding (nama sekolah, logo, tema, dll) |

---

## Autentikasi & Session

- Algoritma tanda tangan: `HS256` menggunakan `JWT_SECRET`.
- Token disimpan di cookie **httpOnly**, `SameSite=Lax`, flag `Secure` aktif di production.
- Nama cookie: `osis_session`, umur 7 hari.
- Payload token: `{ sub: userId, username, role }`.
- Helper di `src/lib/auth.ts`:
  - `getSession()` — baca session dari cookie (nullable).
  - `requireUser()` — throw 401 jika belum login.
  - `requireAdmin()` — throw 403 jika bukan admin.

Semua route handler sensitif memanggil helper ini di awal fungsi.

---

## Tech Stack

**Frontend**

- Next.js 15 App Router + React 18 + TypeScript
- Tailwind CSS 4 + ShadCN UI + Radix UI primitives
- Recharts untuk grafik hasil
- Sonner untuk toast notification
- Lucide untuk ikon
- Framer Motion untuk transisi tab login

**Backend**

- Next.js Route Handlers (`app/api/*`)
- `better-sqlite3` — SQLite embedded, mode WAL
- `jsonwebtoken` — session JWT
- `bcryptjs` — hashing password

**Storage**

- Database: `data/app.db` (SQLite)
- Logo sekolah: `public/uploads/branding/`
- Foto kandidat: `public/uploads/candidates/`
- Log: stdout (kelola sendiri dengan `pm2` / `systemd` di production)

---

## Fitur

### Untuk voter (siswa)

- Pendaftaran akun dengan validasi NIS terhadap whitelist admin.
- Login username + password dengan session persisten 7 hari.
- Halaman kandidat menampilkan foto, visi, dan misi.
- Vote sekali seumur pemilihan, tidak bisa diubah.
- Sticky header saat scroll dan feedback toast setiap aksi.

### Untuk admin

- Statistik ringkas di dashboard: total kandidat, total suara, total pemilih.
- CRUD kandidat lengkap dengan upload foto.
- Kelola siswa: tambah manual atau bulk import via CSV.
- Kelola admin: tambah user admin baru langsung dari UI.
- Hasil voting real-time: bar chart, pie chart, tabel persentase.
- Daftar pemilih dengan filter status sudah/belum.
- Reset seluruh vote (dengan konfirmasi ganda) untuk uji coba.
- Panel branding lengkap: ubah nama sekolah, singkatan, deskripsi landing, footer, logo, dan tema default. Favicon otomatis ikut logo.

### UI/UX

- Dark & light mode otomatis mengikuti sistem, bisa di-override admin.
- Background animasi gradient (blob + grid) di landing dan halaman login.
- Responsif untuk desktop, tablet, dan mobile.
- Meta OpenGraph & Twitter Card otomatis pakai branding aktif.

---

## Keamanan

- Password di-hash dengan `bcryptjs` (salt rounds 10), tidak pernah disimpan plain text.
- JWT di cookie httpOnly — tidak dapat dibaca JavaScript sisi klien.
- RBAC di setiap route sensitif via `requireAdmin()`.
- Anti double vote: primary key `user_id` di tabel `votes` + flag `sudah_vote` di `users`.
- Whitelist NIS mencegah akun liar terdaftar.
- Parameterized queries lewat prepared statement `better-sqlite3` — anti SQL injection.
- Validasi input di frontend dan backend (defense in depth).

Untuk kebutuhan produksi terbuka (publik), tambahkan:

- Rate limiting (misal `next-rate-limit` atau reverse proxy).
- HTTPS via reverse proxy (Nginx / Caddy).
- Backup otomatis file `data/app.db` (harian minimal).
- CAPTCHA di form signup dan login.

---

## Deployment

### Server VPS / komputer sekolah

1. Install Node.js 20 LTS.
2. Clone repo, `npm install`, isi `.env.local`.
3. `npm run build`.
4. Jalankan dengan `pm2`:

   ```bash
   npm install -g pm2
   pm2 start "npm run start" --name pemilihan-osis
   pm2 save
   pm2 startup
   ```

5. Reverse proxy dengan Nginx untuk HTTPS + domain.

### Backup

Cukup salin folder `data/` dan `public/uploads/`. Restore = kembalikan kedua folder tersebut sebelum aplikasi dijalankan.

```bash
tar czf backup-$(date +%F).tar.gz data/ public/uploads/
```

### Reset total

```bash
rm -rf data/app.db data/app.db-wal data/app.db-shm public/uploads/candidates/* public/uploads/branding/*
npm run dev
```

---

## Troubleshooting

**`JWT_SECRET belum di-set`** — Pastikan `.env.local` berada di root project dan `JWT_SECRET` minimal 16 karakter. Restart `npm run dev` setelah mengedit env.

**Foto kandidat / logo tidak muncul** — Cek folder `public/uploads/candidates/` dan `public/uploads/branding/` ada dan writable. File harus punya ekstensi image valid (`.jpg`, `.jpeg`, `.png`, `.webp`, `.svg`). Di deployment, pastikan folder di-mount sebagai volume writable.

**Favicon masih logo lama setelah ganti** — Browser cache favicon agresif. Hard reload dengan `Ctrl+Shift+R` atau buka private window. Cache-busting via query string sudah dipasang otomatis di sisi server.

**"NIS tidak terdaftar" saat signup** — Admin belum meng-import NIS. Login sebagai admin, buka tab **Kelola Siswa**, gunakan **Bulk Import** dengan format CSV `NIS,Nama,Kelas`.

**Error `better-sqlite3` saat `npm install`** — Butuh compile toolchain: `python3`, `make`, dan C++ compiler. Di Windows install Visual Studio Build Tools. Di Debian/Ubuntu: `sudo apt install build-essential python3`.

**Database ingin di-reset** — Hentikan server, hapus `data/app.db`, `data/app.db-wal`, dan `data/app.db-shm`, lalu jalankan ulang. Skema dibuat ulang otomatis.

**Semua user harus login ulang** — Terjadi setelah `JWT_SECRET` diganti. Ini perilaku normal karena token lama tidak lagi valid.

**Port 3000 dipakai** — Jalankan dengan port lain: `PORT=8080 npm run dev` atau `PORT=8080 npm run start`.

---

## Contoh Import NIS

Format CSV (satu baris per siswa, dengan header):

```csv
NIS,Nama Lengkap,Kelas
1234,Ahmad Fauzi,XII RPL 1
1235,Siti Nurhaliza,XII RPL 1
1236,Budi Santoso,XII TKJ 1
```

File contoh siap pakai: `data/siswa-contoh.csv`.

---

## Kontak & Lisensi

**Pengembang**

- Website: [sidycoders.xyz](https://sidycoders.xyz)
- Email: xyydycoders@gmail.com
- WhatsApp: +6285719898124

**Lisensi**

© 2026 sidycoders.xyz — Sistem Pemilihan OSIS. Bebas dipakai dan dimodifikasi untuk kebutuhan sekolah manapun. Cantumkan atribusi ke pengembang jika didistribusikan ulang.
