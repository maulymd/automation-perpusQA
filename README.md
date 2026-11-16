# Automation PerpusQA 📚🧪

Framework test automation modern untuk API dan E2E **PerpusQA** (`https://playground.aminhamzah.com`) berbasis **Playwright**, **TypeScript**, **Page Object Model (POM)**, dan **Zod Contract Schema Validation**.

---

## 🏗️ Arsitektur Proyek

```text
automation-perpusQA/
├── .docs/                             # Dokumentasi API, aturan bisnis, & RBAC matrix
├── .agents/skills/                    # SOP & panduan automation skill (playwright-pom)
├── pages/                             # Page Object Model (POM) classes & components
│   ├── base.page.ts                   # Induk BasePage dengan helper navigasi & session
│   ├── login.page.ts                  # POM Halaman Login (/login-perpus.html)
│   ├── loans.page.ts                  # POM Halaman Pinjaman Anggota (/perpus-pinjaman.html)
│   ├── operator-loans.page.ts         # POM Meja Layanan Pustakawan (/perpus-operator.html#pinjaman)
│   ├── catalog.page.ts                # POM Katalog Anggota (/perpus-anggota.html)
│   ├── book-detail.page.ts            # POM Detail Buku (/perpus-buku.html?id=X)
│   └── components/                    # Reusable web components
│       ├── confirm-dialog.component.ts# Komponen modal dialog konfirmasi (role="dialog")
│       └── toast.component.ts         # Komponen toast status (#toast[role="status"])
├── fixtures/                          # Playwright custom multi-role fixtures & API clients
│   ├── auth.fixture.ts                # Smart context: operatorRequest, memberRequest, blockedRequest
│   ├── api.fixture.ts                 # Pre-authenticated domain helpers (books, loans)
│   ├── page.fixture.ts                # Injeksi instans Page Object Model ke setiap test
│   └── index.ts                       # Unified test fixture export (Selalu import test dari sini)
├── helpers/
│   ├── api/                           # Encapsulated API client wrappers (AuthApi, BooksApi, LoansApi)
│   └── schemas/                       # Zod contract schemas & inferred TypeScript types
│       ├── auth.schema.ts             # Auth, me profile, & error schemas
│       ├── books.schema.ts            # Book & catalog list schemas
│       └── loans.schema.ts            # Loan & loan list schemas
├── specs/                             # Test plans & skenario arsitektur
│   └── peminjaman.plan.md             # Dokumen rencana pengujian komprehensif fitur peminjaman
├── tests/                             # Test suites (Total: 103 Automated Tests)
│   ├── e2e/                           # E2E & Hybrid UI tests (15 tests)
│   │   ├── peminjaman.spec.ts         # Fitur Manajemen Peminjaman Buku (15 tests)
│   │   └── seed.spec.ts               # Seed otentikasi login
│   └── api/                           # Direct API test suites (88 tests)
│       ├── auth.spec.ts               # Authentication & session tests (8 tests)
│       ├── smoke.spec.ts              # P0 Smoke & golden circulation journey (3 tests)
│       ├── rbac.spec.ts               # Role-Based Access Control security matrix (39 tests)
│       ├── boundary-catalog.spec.ts      # Negative & boundary tests modul katalog (15 tests)
│       ├── boundary-loans.spec.ts        # Negative & boundary tests modul peminjaman & antrean (11 tests)
│       └── boundary-auth-members.spec.ts # Negative & boundary tests modul auth, member, & ulasan (12 tests)
├── .env.example                       # Template variabel lingkungan
├── playwright.config.ts               # Konfigurasi terpusat Playwright
└── tsconfig.json                      # TypeScript compiler config & path aliases
```

---

## 📋 Daftar Test Case yang Telah Diimplementasikan (Total: 103 Tests)

Semua skenario pengujian di bawah ini aktif, terotomatisasi, dan terverifikasi **100% lulus (103 passed)**:

### 1. Modul Autentikasi & Sesi ([`tests/api/auth.spec.ts`](./tests/api/auth.spec.ts) · 8 Tests)
* **`POST /api/perpus/login`**
  * `[AUTH-01]` Login valid sebagai Pustakawan (`operator`) & validasi kontrak `LoginResponseSchema` (200 OK).
  * `[AUTH-02]` Login valid sebagai Anggota (`anggota`) & validasi kontrak `LoginResponseSchema` (200 OK).
  * `[AUTH-03]` Login gagal dengan password salah & validasi `ApiErrorSchema` (401 Unauthorized).
  * `[AUTH-04]` Login gagal dengan body/payload kosong & validasi `ApiErrorSchema` (400 Bad Request).
* **`GET /api/perpus/me`**
  * `[AUTH-05]` Ambil profil Pustakawan via fixture `operatorRequest` & validasi `OperatorMeSchema` (200 OK).
  * `[AUTH-06]` Ambil profil Anggota via fixture `memberRequest` & validasi batas pinjam 3 buku `MemberMeSchema` (200 OK).
  * `[AUTH-07]` Panggilan profil tanpa token via `publicRequest` & validasi `reason: "missing"` (401 Unauthorized).
* **`POST /api/perpus/logout`**
  * `[AUTH-08]` Logout sesi aktif (204 No Content) dan verifikasi token lama otomatis tidak berlaku (`401` dengan `reason: "invalid"`).

---

### 2. P0 Smoke & Golden Circulation Journey ([`tests/api/smoke.spec.ts`](./tests/api/smoke.spec.ts) · 3 Tests)
* **`[P0-SMOKE-01]` Catalog Healthcheck**: Mengambil daftar buku katalog & validasi paginasi serta schema `BookListSchema` (200 OK).
* **`[P0-SMOKE-02]` Loans Healthcheck**: Mengambil daftar pinjaman aktif anggota & validasi schema `LoanListSchema` (200 OK).
* **`[P0-SMOKE-03]` Golden Flow (Full Circulation Lifecycle)**:
  1. **Pustakawan** membuat buku uji baru (`POST /books`, status 201, stok `available = 2`).
  2. **Anggota** mencari buku tersebut di katalog (`GET /books?q=...`, status 200).
  3. **Anggota** meminjam buku tersebut (`POST /loans`, status 201, jatuh tempo +7 hari).
  4. **Verifikasi Stok**: Stok buku berkurang dari 2 menjadi 1.
  5. **Pustakawan** menerima pengembalian buku (`POST /loans/{id}/return`, status 200, status pinjaman `"Dikembalikan"`).
  6. **Verifikasi Pemulihan Stok**: Stok buku kembali utuh dari 1 menjadi 2.
  7. **Cleanup**: Pustakawan menghapus buku uji (`DELETE /books/{id}`, status 204 & verifikasi 404).

---

### 3. Matriks Keamanan Hak Akses / RBAC ([`tests/api/rbac.spec.ts`](./tests/api/rbac.spec.ts) · 39 Tests)
* **Batasan Peran Anggota (10 Tests · Wajib `403` dengan `reason: "role"`)**:
  * `[RBAC-01]` Anggota ditolak menambah buku di katalog (`POST /api/perpus/books`).
  * `[RBAC-02]` Anggota ditolak mengubah data/eksemplar buku (`PATCH /api/perpus/books/{id}`).
  * `[RBAC-03]` Anggota ditolak menghapus buku dari katalog (`DELETE /api/perpus/books/{id}`).
  * `[RBAC-04]` Anggota ditolak melihat daftar anggota (`GET /api/perpus/members`).
  * `[RBAC-05]` Anggota ditolak mendaftarkan anggota baru (`POST /api/perpus/members`).
  * `[RBAC-06]` Anggota ditolak melihat detail anggota (`GET /api/perpus/members/{id}`).
  * `[RBAC-07]` Anggota ditolak mengubah profil/status anggota (`PATCH /api/perpus/members/{id}`).
  * `[RBAC-08]` Anggota ditolak menghapus anggota (`DELETE /api/perpus/members/{id}`).
  * `[RBAC-09]` Anggota ditolak memproses pengembalian buku (`POST /api/perpus/loans/{id}/return`).
  * `[RBAC-10]` Anggota ditolak melunasi denda anggota (`POST /api/perpus/members/{id}/pay-fines`).
* **Batasan Peran Pustakawan (5 Tests · Wajib `403` dengan `reason: "role"`)**:
  * `[RBAC-11]` Pustakawan ditolak meminjam buku (`POST /api/perpus/loans`).
  * `[RBAC-12]` Pustakawan ditolak mendaftar antrean/reservasi (`POST /api/perpus/books/{id}/reservations`).
  * `[RBAC-13]` Pustakawan ditolak memperpanjang pinjaman (`POST /api/perpus/loans/{id}/extend`).
  * `[RBAC-14]` Pustakawan ditolak menulis ulasan buku (`POST /api/perpus/books/{id}/reviews`).
  * `[RBAC-15]` Pustakawan ditolak mengubah ulasan anggota (`PATCH /api/perpus/reviews/{id}`).
* **Batasan Anggota Diblokir & Privasi Data (2 Tests)**:
  * `[RBAC-16]` Anggota diblokir ditolak meminjam buku (`403` dengan `reason: "blocked"`).
  * `[RBAC-17]` Anggota ditolak mengakses/memperpanjang pinjaman milik orang lain (`404 Not Found` Data Privacy Masking).
* **Penegakan Akses Publik (21 Tests · Wajib `401` dengan `reason: "missing"`)**:
  * `[RBAC-18 s/d 38]` Pengujian data-driven pada 21 endpoint terproteksi (`/me`, `/books`, `/members`, `/loans`, `/reservations`, `/reviews`) yang wajib menolak pemanggilan tanpa token.
* **Endpoint Publik Terbuka (1 Test)**:
  * `[RBAC-39]` `POST /api/perpus/logout` dapat diakses publik tanpa token (204 No Content).

---

### 4. Negative & Boundary Tests: Katalog Buku ([`tests/api/boundary-catalog.spec.ts`](./tests/api/boundary-catalog.spec.ts) · 15 Tests)
* **Query Parameters Boundary (GET `/books`)**:
  * `[CAT-BND-01]` Batas bawah nomor halaman `page=0` (400 Bad Request).
  * `[CAT-BND-02]` Batas atas ukuran halaman `limit=21` (400 Bad Request, max limit 20).
  * `[CAT-BND-03]` Batas bawah ukuran halaman `limit=0` (400 Bad Request).
  * `[CAT-BND-04]` Kategori tidak dikenal `category=InvalidCategory` (400 Bad Request).
  * `[CAT-BND-05]` Parameter pengurutan tidak valid `sort=unsupported_sort` (400 Bad Request).
* **Payload Creation Boundary (POST `/books`)**:
  * `[CAT-BND-06]` Tahun terbit di bawah batas minimum `year=1499` (422 Unprocessable Content, min 1500).
  * `[CAT-BND-07]` Tahun terbit melebihi batas masa depan `year=2099` (422 Unprocessable Content).
  * `[CAT-BND-08]` Jumlah eksemplar negatif `copies=-1` (422 Unprocessable Content).
  * `[CAT-BND-09]` Jumlah eksemplar melebihi batas `copies=100` (422 Unprocessable Content, max 99).
  * `[CAT-BND-10]` Nama penulis terlalu pendek (1 karakter) (422 Unprocessable Content, min 2).
* **Business Rule Conflicts (409 Conflict)**:
  * `[CAT-BND-11]` Duplikasi buku: Judul dan penulis yang sama persis sudah ada di katalog (409 Conflict).
  * `[CAT-BND-12]` Menghapus buku yang eksemplarnya sedang dipinjam aktif oleh anggota (409 Conflict).
* **Non-Existent Resources & Empty Update (404 & 422)**:
  * `[CAT-BND-13]` `GET /books/{id}` dengan ID tidak ada (404 Not Found).
  * `[CAT-BND-14]` `PATCH /books/{id}` dengan body kosong tanpa field yang diubah (422 Unprocessable Content).
  * `[CAT-BND-15]` `DELETE /books/{id}` dengan ID tidak ada (404 Not Found).

---

### 5. Negative & Boundary Tests: Peminjaman & Antrean ([`tests/api/boundary-loans.spec.ts`](./tests/api/boundary-loans.spec.ts) · 11 Tests)
* **Query Parameters Boundary (GET `/loans`)**:
  * `[LOAN-BND-01]` Nilai status pinjaman tidak dikenal (400 Bad Request).
  * `[LOAN-BND-02]` Batas bawah limit halaman `limit=0` (400 Bad Request).
  * `[LOAN-BND-03]` Batas atas limit halaman `limit=51` (400 Bad Request, max 50).
* **Borrowing Constraints (POST `/loans`)**:
  * `[LOAN-BND-04]` Meminjam buku dengan `bookId` tidak ada (404 Not Found).
  * `[LOAN-BND-05]` Format tanggal `borrowedAt` tidak sesuai YYYY-MM-DD (422 Unprocessable Content).
  * `[LOAN-BND-06]` Meminjam kembali buku yang sedang dipinjam aktif oleh anggota yang sama (409 Conflict).
  * `[LOAN-BND-07]` Meminjam buku yang stok eksemplarnya 0 (buku ID 7 "Lessons Learned in Software Testing") (409 Conflict).
* **Extend & Return Constraints**:
  * `[LOAN-BND-08]` Memperpanjang pinjaman dengan ID tidak ada (404 Not Found).
  * `[LOAN-BND-09]` Menerima pengembalian pinjaman dengan ID tidak ada (404 Not Found).
* **Reservation Constraints (POST `/reservations`)**:
  * `[LOAN-BND-10]` Mendaftar antrean pada buku yang eksemplar bebasnya masih tersedia (> 0) (409 Conflict).
  * `[LOAN-BND-11]` Mendaftar antrean pada buku dengan ID tidak ada (404 Not Found).

---

### 6. Negative & Boundary Tests: Auth, Anggota, & Ulasan ([`tests/api/boundary-auth-members.spec.ts`](./tests/api/boundary-auth-members.spec.ts) · 12 Tests)
* **Library Creation Boundary (POST `/libraries`)**:
  * `[AUTH-BND-01]` Nama perpustakaan terlalu pendek (< 3 karakter) (422 Unprocessable Content).
  * `[AUTH-BND-02]` Username mengandung huruf besar / karakter ilegal (422 Unprocessable Content).
  * `[AUTH-BND-03]` Password terlalu pendek (< 6 karakter) (422 Unprocessable Content).
  * `[AUTH-BND-04]` Username perpustakaan sudah terpakai oleh akun lain (409 Conflict).
* **Member Management Boundary (POST/PATCH/DELETE `/members`)**:
  * `[MBR-BND-01]` Nama anggota terlalu pendek (< 2 karakter) (422 Unprocessable Content).
  * `[MBR-BND-02]` Username anggota sudah terpakai (409 Conflict).
  * `[MBR-BND-03]` Mengubah akun demo yang dikunci (`AGT-1001`) (409 Conflict).
  * `[MBR-BND-04]` Menghapus akun demo yang dikunci (`AGT-1001`) (409 Conflict).
  * `[MBR-BND-05]` Mengakses detail anggota dengan ID tidak ada (404 Not Found).
  * `[MBR-BND-06]` Filter status anggota tidak valid pada `GET /members` (400 Bad Request).
* **Book Reviews Boundary (POST `/reviews`)**:
  * `[REV-BND-01]` Rating ulasan di luar batas 1 sampai 5 (`rating=6`) (422 Unprocessable Content).
  * `[REV-BND-02]` Menulis ulasan untuk buku dengan ID tidak ada (404 Not Found).

---

### 7. Manajemen Peminjaman Buku: E2E & POM ([`tests/e2e/peminjaman.spec.ts`](./tests/e2e/peminjaman.spec.ts) · 15 Tests)
Pengujian antarmuka pengguna (UI) dan alur hybrid berbasis **Page Object Model (POM)** ketat untuk fitur sirkulasi di portal anggota (`/perpus-pinjaman.html`) dan meja layanan pustakawan (`/perpus-operator.html#pinjaman`):

* **Skenario Positif (Happy Path & Circulation Flows)**:
  * `[TC-LOAN-01]` **Statistik & Kartu Pinjaman Aktif**: Anggota melihat ringkasan kuota pinjam (`loan-count`), antrean, tagihan denda, serta kartu pinjaman aktif (`@smoke` `@hybrid`).
  * `[TC-LOAN-02]` **Perpanjangan Durasi Pinjaman**: Anggota berhasil memperpanjang jatuh tempo buku (+7 hari) melalui modal konfirmasi dialog & menerima toast sukses (`@smoke` `@hybrid`).
  * `[TC-LOAN-03]` **Pembatalan Antrean Reservasi**: Anggota berpindah ke tab antrean, memicu modal pembatalan destruktif, dan membatalkan antrean buku (`@regression` `@hybrid`).
  * `[TC-LOAN-04]` **Validasi Komponen Tab Antrean**: Memverifikasi panel antrean menampilkan nomor urutan antrean aktif atau empty state antrean (`@regression` `@hybrid`).
  * `[TC-LOAN-05]` **Tabel Riwayat Pengembalian & Denda**: Anggota dapat melihat histori pengembalian buku, status denda (Lunas/Belum dibayar/Tepat waktu), serta kontrol paginasi (`@regression`).
  * `[TC-LOAN-06]` **Penerimaan Pengembalian Buku oleh Pustakawan**: Pustakawan menerima pengembalian buku di meja layanan melalui modal konfirmasi & stok buku kembali bertambah (`@smoke` `@hybrid`).
  * `[TC-LOAN-07]` **Filter Status Pinjaman Meja Pustakawan**: Memfilter daftar pinjaman berdasarkan status `aktif`, `selesai`, dan `semua` (`@regression`).
  * `[TC-LOAN-08]` **Pencarian Pinjaman Real-Time**: Pustakawan mencari pinjaman berdasarkan nama anggota secara reaktif (`@regression`).
* **Skenario Negatif, RBAC & Boundary**:
  * `[TC-LOAN-09]` **Akses Tamu Publik (Unauthenticated)**: Mengakses langsung `/perpus-pinjaman.html` tanpa login menampilkan panel `#signed-out-view` dan menyembunyikan data pinjaman (`@regression`).
  * `[TC-LOAN-10]` **Penolakan Akses Pustakawan**: Pustakawan yang membuka portal anggota `/perpus-pinjaman.html` ditolak via `#denied-view` (`@regression`).
  * `[TC-LOAN-11]` **Pencegahan Perpanjangan Ganda**: Kartu buku yang sudah pernah diperpanjang menyembunyikan tombol perpanjang dan menampilkan badge statis `Sudah diperpanjang` (`@regression` `@hybrid`).
  * `[TC-LOAN-12]` **Restriksi Anggota Diblokir**: Anggota berstatus `Diblokir` melihat banner pemblokiran dan tombol perpanjang dinonaktifkan (`disabled`) (`@regression`).
  * `[TC-LOAN-13]` **Pembatalan Modal Dialog (User Abort)**: Menutup modal konfirmasi tidak mengeksekusi request perpanjangan ke server (`@regression`).
  * `[TC-LOAN-14]` **Pencarian Pinjaman Nihil**: Pencarian dengan kata kunci acak pada meja pustakawan menampilkan pesan *empty state* ramah pengguna (`@regression`).
  * `[TC-LOAN-15]` **Validasi Batasan Peminjaman di Detail Buku**: Memvalidasi ketersediaan stok, tombol aksi, serta catatan batas maksimal pinjam 3 buku di `/perpus-buku.html` (`@regression`).

---

## 🚀 Memulai (Quick Start)

### 1. Instalasi Dependencies
```bash
npm install
```

### 2. Konfigurasi Lingkungan (`.env`)
Salin file `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```
Isi konfigurasi pada file `.env`:
```env
BASE_URL=https://playground.aminhamzah.com
OPERATOR_USER=pustakawan
OPERATOR_PASS=pustaka123
MEMBER_USER=anggota
MEMBER_PASS=baca123
BLOCKED_USER=diblokir
BLOCKED_PASS=baca123
```

---

## 🧪 Menjalankan Pengujian

| Perintah | Deskripsi |
| :--- | :--- |
| `npm test` | Menjalankan seluruh pengujian (API & Browser). |
| `npm run test:api` | Menjalankan seluruh 88 API test cases. |
| `npm run test:e2e` | Menjalankan seluruh 15 E2E & Hybrid UI test cases (Chromium). |
| `npm run test:smoke` | Menjalankan pengujian P0 Smoke & Healthcheck (`@smoke`). |
| `npm run test:regression` | Menjalankan seluruh pengujian regresi (`@regression`). |
| `npm run test:rbac` | Menjalankan pengujian keamanan Matriks Hak Akses (39 test cases). |
| `npm run test:boundary` | Menjalankan seluruh Negative & Boundary test suites (38 test cases). |
| `npm run test:ui` | Membuka interactive mode Playwright UI. |
| `npm run report` | Membuka laporan HTML interaktif hasil pengujian. |

---

## 🛡️ Standar Kualitas & Best Practice

1. **Strict Page Object Model (POM)**: Seluruh selector dan method aksi berada di `pages/` (mewarisi `BasePage`). File `.spec.ts` bebas dari raw selector (`page.locator`, `page.click`).
2. **Custom Multi-Role Fixtures**: Otentikasi otomatis multi-peran (`operatorRequest`, `memberRequest`, `blockedRequest`, `publicRequest`) serta injeksi instans Page Object via `@fixtures/index`.
3. **Contract Schema Testing**: Semua response API divalidasi struktur dan tipe datanya secara ketat menggunakan **Zod** (`safeParse`).
4. **Data Privacy Masking**: Memvalidasi kepatuhan privasi data di mana data milik pengguna lain otomatis dibalas `404 Not Found`.
5. **Boundary & Negative Coverage**: Menguji batas bawah/atas paginasi, format tanggal, panjang string, proteksi akun demo, limit kuota 3 buku, dan pencegahan perpanjangan ganda.
6. **Zero Flakiness & Zero Artificial Waits**: Tidak menggunakan `page.waitForTimeout()` atau `networkidle`. Mengandalkan Playwright *web-first assertions* (`toBeVisible()`, `toHaveText()`).
