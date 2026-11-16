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
