# Playwright Automation Standards & Agent Guidelines

Semua agent yang beroperasi di repositori ini **WAJIB** mengikuti standar arsitektur dan konvensi pengujian yang didefinisikan dalam skill [`.agents/skills/playwright-pom/SKILL.md`](./.agents/skills/playwright-pom/SKILL.md).

---

## 📌 Aturan Utama yang Wajib Ditaati:

### 1. Page Object Model (POM) Ketat
* **DILARANG KERAS** menulis raw selector atau memanggil `page.click('...')`, `page.fill('...')`, `page.locator('...')` langsung di dalam file test `.spec.ts`.
* Semua locator dan method aksi harus berada di dalam kelas Page Object di folder `pages/` (mewarisi `BasePage`) atau komponen di `pages/components/`.
* Jika method atau page object belum ada, buat atau update Page Object terlebih dahulu sebelum menulis test.

### 2. Custom Fixtures
* **SELALU import `test` dan `expect` dari `@fixtures/index`**, JANGAN dari `@playwright/test`:
  ```typescript
  import { test, expect } from '@fixtures/index';
  ```
* Gunakan custom fixture yang sudah disediakan:
  * `operatorRequest` / `operatorBooksApi` / `operatorLoansApi`: Request berotentikasi sebagai Pustakawan.
  * `memberRequest` / `memberBooksApi` / `memberLoansApi`: Request berotentikasi sebagai Anggota Aktif.
  * `blockedRequest`: Request berotentikasi sebagai Anggota Diblokir.
  * `publicRequest`: Request tanpa token.

### 3. TypeScript Path Aliases
* Selalu gunakan path alias:
  * `@pages/*` $\rightarrow$ `pages/*`
  * `@fixtures/*` $\rightarrow$ `fixtures/*`
  * `@helpers/*` $\rightarrow$ `helpers/*`
  * `@data/*` $\rightarrow$ `data/*`

### 4. Prioritas Locator di Page Object
1. `getByRole()` (Paling direkomendasikan & resilient)
2. `getByTestId()`
3. `getByText()` / `getByLabel()` / `getByPlaceholder()`
4. `locator('css')` (Hanya opsi terakhir)

### 5. Larangan Assertions di Page Object
* Page Object hanya melakukan aksi atau mengembalikan state mentah (string, count, boolean).
* Semua pemanggilan `expect(...)` harus berada di dalam file `.spec.ts`.

### 6. Larangan Artificial Timeout
* **DILARANG KERAS** menggunakan `page.waitForTimeout()` atau `networkidle`.
* Selalu gunakan Playwright web-first assertions (`toBeVisible()`, `toHaveText()`) atau automatic waiting bawaan locator.

### 7. Contract Schema Testing (Zod)
* Untuk pengujian API, selalu validasi struktur respons menggunakan skema Zod di `helpers/schemas/` dengan method `safeParse()`.
