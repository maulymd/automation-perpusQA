# Automation PerpusQA 📚🧪

Framework test automation modern untuk API dan E2E **PerpusQA** (`https://playground.aminhamzah.com`) berbasis **Playwright**, **TypeScript**, **Page Object Model (POM)**, dan **Zod Contract Schema Validation**.

---

## 🏗️ Arsitektur Proyek

```text
automation-perpusQA/
├── .docs/                    # Dokumentasi API, aturan bisnis, & RBAC matrix
├── .agents/skills/           # SOP & panduan automation skill (playwright-pom)
├── fixtures/                 # Playwright custom multi-role fixtures & API clients
│   ├── auth.fixture.ts       # Smart context: operatorRequest, memberRequest, blockedRequest
│   ├── api.fixture.ts        # Pre-authenticated domain helpers (books, loans)
│   └── index.ts              # Unified test fixture export
├── helpers/
│   ├── api/                  # Encapsulated API client wrappers (AuthApi, BooksApi, LoansApi)
│   └── schemas/              # Zod contract schemas & inferred TypeScript types
├── tests/
│   └── api/                  # Test suites
│       ├── auth.spec.ts      # Authentication & session tests (8 tests)
│       ├── smoke.spec.ts     # P0 Smoke & golden circulation journey (3 tests)
│       └── rbac.spec.ts      # Role-Based Access Control security matrix (39 tests)
├── .env.example              # Template variabel lingkungan
├── playwright.config.ts      # Konfigurasi terpusat Playwright
└── tsconfig.json             # TypeScript compiler config & path aliases
```

---

## 📋 Daftar Test Case yang Telah Diimplementasikan (Total: 50 Tests)

Semua skenario pengujian di bawah ini telah aktif, otomatis, dan terverifikasi **100% lulus (50 passed)** dalam waktu **~2.7 detik**:

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
| `npm run test:api` | Menjalankan seluruh API test suite (50 test case). |
| `npm run test:smoke` | Menjalankan pengujian P0 Smoke & Healthcheck. |
| `npm run test:rbac` | Menjalankan pengujian keamanan Matriks Hak Akses (39 test case). |
| `npm run test:ui` | Membuka interactive mode Playwright UI. |
| `npm run report` | Membuka laporan HTML interaktif hasil pengujian. |

---

## 🛡️ Standar Kualitas & Best Practice

1. **Custom Multi-Role Fixtures**: Tidak perlu login berulang atau pasang token manual di setiap test. Cukup gunakan `{ operatorRequest }`, `{ memberRequest }`, `{ blockedRequest }`, atau `{ publicRequest }`.
2. **Contract Schema Testing**: Semua response divalidasi struktur dan tipe datanya secara ketat menggunakan **Zod** (`safeParse`).
3. **Data Privacy Masking**: Memvalidasi kepatuhan privasi data di mana data milik pengguna lain otomatis dibalas `404 Not Found`.
4. **Zero Flakiness**: Menggunakan cleanup otomatis (`finally` block) sehingga database pengujian selalu kembali bersih setelah test berjalan.
