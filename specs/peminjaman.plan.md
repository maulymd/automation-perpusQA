# Test Plan: Manajemen Peminjaman Buku (/peminjaman)

Dokumen rencana pengujian otomatis untuk fitur **Manajemen Peminjaman Buku** di aplikasi PerpusQA (`https://playground.aminhamzah.com`). Rencana ini dirancang berdasarkan arsitektur **Page Object Model (POM)**, **Custom Fixtures**, **Hybrid Testing (API Seed + UI Flow)**, dan standar pengujian Playwright proyek.

---

## 1. Overview & Architecture Mapping

### 1.1 Fitur & Cakupan Area
* **Portal Anggota (`/perpus-pinjaman.html` / `#pinjaman`)**:
  * Ringkasan statistik (jumlah pinjaman aktif, antrean, denda).
  * Pengingat tenggat waktu jatuh tempo dan tagihan denda.
  * Tab **Sedang dipinjam**: Kartu peminjaman aktif, indikator sisa hari, dan alur perpanjangan durasi pinjam.
  * Tab **Antrean**: Daftar reservasi buku, status antrean ("Antrean ke-N" / "Siap diambil"), pembatalan antrean, dan konversi ke pinjaman.
  * Tab **Riwayat**: Tabel riwayat pengembalian buku, status denda (Lunas / Belum dibayar / Tepat waktu), dan paginasi riwayat.
* **Portal Pustakawan (`/perpus-operator.html#pinjaman`)**:
  * Monitoring peminjaman seluruh anggota (Filter: Aktif, Terlambat, Selesai, Semua).
  * Pencarian instan pinjaman berdasarkan ID pinjaman, judul buku, atau nama anggota.
  * Penerimaan pengembalian buku (`return`) dengan kalkulasi denda otomatis bagi buku terlambat.
* **Katalog & Detail Buku (`/perpus-anggota.html` & `/perpus-buku.html`)**:
  * Titik awal peminjaman buku baru (Validasi stok, batas limit pinjaman 3 buku, dan status kartu).

### 1.2 Persona & Peran Pengguna
1. **Anggota Aktif (`anggota` / `baca123`)**:
   * Memiliki akses penuh ke halaman `/perpus-pinjaman.html`.
   * Dapat memperpanjang pinjaman (maksimal 1 kali, sebelum jatuh tempo).
   * Dapat membatalkan antrean reservasi.
2. **Pustakawan (`pustakawan` / `pustaka123`)**:
   * Memproses pengembalian buku anggota di meja layanan (`perpus-operator.html#pinjaman`).
   * Mengaudit pinjaman terlambat dan mencatat denda.
   * Dilarang mengakses portal anggota (`/perpus-pinjaman.html` $\rightarrow$ ditolak dengan `#denied-view`).
3. **Anggota Diblokir (`diblokir` / `baca123`)**:
   * Kartu dinonaktifkan (`status: "Diblokir"`).
   * Dapat melihat pinjaman berjalan, namun aksi perpanjang dinonaktifkan (`disabled`) dan muncul banner pemblokiran.
4. **Tamu / Pengguna Publik (Unauthenticated)**:
   * Mengakses langsung URL `/perpus-pinjaman.html` tanpa token/sesi login $\rightarrow$ diarahkan ke `#signed-out-view`.

### 1.3 Target Page Objects & Komponen
| Page Object / Komponen | File Path | Tanggung Jawab Utama |
| :--- | :--- | :--- |
| `LoginPage` | `pages/login.page.ts` | Otentikasi username & password, submit form login, verifikasi redirect. |
| `LoansPage` | `pages/loans.page.ts` | Mengelola interaksi pada `/perpus-pinjaman.html` (stat cards, tab switching, daftar kartu pinjaman, antrean, riwayat). |
| `OperatorLoansPage` | `pages/operator-loans.page.ts` | Mengelola meja layanan pustakawan (`perpus-operator.html#pinjaman`): filter status, search pinjaman, aksi terima pengembalian buku. |
| `CatalogPage` | `pages/catalog.page.ts` | Navigasi katalog anggota, pencarian buku, klik tombol Pinjam atau Antre. |
| `BookDetailPage` | `pages/book-detail.page.ts` | Validasi ketersediaan stok buku, aksi checkout peminjaman/antre dari halaman detail. |
| `ConfirmDialogComponent` | `pages/components/confirm-dialog.component.ts` | Interaksi dengan modal konfirmasi aplikasi (`role="dialog"`): klik tombol Konfirmasi (Perpanjang/Batalkan/Terima) atau Batal. |
| `ToastComponent` | `pages/components/toast.component.ts` | Verifikasi notifikasi toast melayang (`#toast[role="status"]`). |

### 1.4 Target API Helpers (Hybrid Seeding & Teardown)
* `helpers/api/auth.api.ts` (`AuthApi`): Otentikasi via API untuk generate token persona.
* `helpers/api/books.api.ts` (`BooksApi`): Memastikan ketersediaan buku atau manipulasi stok sebelum UI test.
* `helpers/api/loans.api.ts` (`LoansApi`): Seeding pinjaman aktif, extend loan via API, return loan via API untuk persiapan data riwayat.

---

## 2. Test Scenarios (Positif / Happy Path)

### Scenario 1.1: Tampilan Ringkasan Statistik dan Kartu Pinjaman Aktif
- **Tag**: `@smoke` `@hybrid`
- **Persona**: Anggota Aktif (`anggota`)
- **Prerequisites (Seed)**: Anggota memiliki minimal 1 pinjaman aktif (dapat dipastikan via API `LoansApi.createLoan`).
- **Test Type**: Hybrid (API seed + UI assertion)
- **Target Page Object**: `LoginPage`, `LoansPage`
- **Langkah-Langkah**:
  1. Login sebagai `anggota` melalui `LoginPage.login()`.
  2. Buka halaman pinjaman melalui navbar atau navigasi langsung ke `/perpus-pinjaman.html`.
  3. Verifikasi panel statistik ringkasan pinjaman.
  4. Verifikasi kartu pinjaman pada tab default "Sedang dipinjam".
- **Expected Results**:
  - URL halaman adalah `/perpus-pinjaman.html` dengan judul "Pinjaman saya - PerpusQA".
  - Stat `data-testid="loan-count"` menampilkan teks format `X dari 3` sesuai jumlah riil.
  - Kartu pinjaman (`data-testid="loan-card"`) menampilkan cover, judul buku, tanggal pinjam, dan badge status sisa hari (`data-testid="loan-status"`).
  - Terdapat tombol "Perpanjang" yang dalam kondisi aktif (`toBeEnabled()`).

### Scenario 1.2: Anggota Berhasil Memperpanjang Pinjaman (Extend Loan Flow)
- **Tag**: `@smoke` `@hybrid`
- **Persona**: Anggota Aktif (`anggota`)
- **Prerequisites (Seed)**: Pastikan ada 1 pinjaman aktif yang belum pernah diperpanjang (`extended: false`) dan belum melewati jatuh tempo.
- **Test Type**: Hybrid (UI Action + API Verification)
- **Target Page Object**: `LoansPage`, `ConfirmDialogComponent`, `ToastComponent`
- **Langkah-Langkah**:
  1. Masuk ke halaman `/perpus-pinjaman.html`.
  2. Temukan kartu buku target dan klik tombol "Perpanjang" (`data-extend`).
  3. Tunggu hingga modal dialog konfirmasi (`role="dialog"`) muncul.
  4. Periksa deskripsi modal yang menyebutkan penambahan waktu 7 hari.
  5. Klik tombol konfirmasi "Perpanjang" pada modal dialog.
  6. Tunggu respons pembaruan data.
- **Expected Results**:
  - Modal dialog konfirmasi tertutup.
  - Komponen toast (`#toast`) muncul dengan pesan sukses: `"<Judul Buku>" diperpanjang sampai <Tanggal Baru>`.
  - Tombol "Perpanjang" pada kartu buku tersebut hilang dan berganti menjadi badge `<span class="chip muted">Sudah diperpanjang</span>`.
  - Tanggal jatuh tempo pada kartu bertambah 7 hari.

### Scenario 1.3: Anggota Melihat dan Membatalkan Antrean Buku (Reservation Flow)
- **Tag**: `@regression` `@hybrid`
- **Persona**: Anggota Aktif (`anggota`)
- **Prerequisites (Seed)**: Anggota memiliki 1 antrean aktif (dibuat via API `POST /api/perpus/books/{id}/reservations`).
- **Test Type**: Hybrid
- **Target Page Object**: `LoansPage`, `ConfirmDialogComponent`, `ToastComponent`
- **Langkah-Langkah**:
  1. Masuk ke `/perpus-pinjaman.html`.
  2. Klik tab "Antrean" (`#tab-antrean`).
  3. Verifikasi kartu antrean (`data-testid="reservation-card"`) tampil dengan nomor urut antrean.
  4. Klik tombol "Batalkan" (`data-cancel`) pada kartu antrean.
  5. Modal dialog konfirmasi pembatalan antrean terbuka dengan tombol aksi berlabel "Batalkan antrean".
  6. Klik "Batalkan antrean".
- **Expected Results**:
  - Modal konfirmasi tertutup.
  - Toast muncul dengan pesan: `"Antrean dibatalkan"`.
  - Kartu antrean terhapus dari daftar antrean.
  - Angka antrean aktif di ringkasan stat berkurang 1.

### Scenario 1.4: Antrean Berstatus 'Siap Diambil' Menampilkan Tombol Pinjam Langsung
- **Tag**: `@regression` `@hybrid`
- **Persona**: Anggota Aktif (`anggota`)
- **Prerequisites (Seed)**: Buat kondisi antrean anggota berstatus `Siap diambil` (`status: "Siap diambil"`).
- **Test Type**: Hybrid
- **Target Page Object**: `LoansPage`, `BookDetailPage`
- **Langkah-Langkah**:
  1. Masuk ke `/perpus-pinjaman.html` dan pilih tab "Antrean".
  2. Periksa status pada kartu antrean target.
  3. Klik tombol/link "Pinjam sekarang".
- **Expected Results**:
  - Kartu antrean memiliki chip badge `data-testid="reservation-status"` dengan status "Siap diambil".
  - Tombol "Pinjam sekarang" mengarahkan pengguna ke halaman detail buku (`perpus-buku.html?id=X`) untuk menyelesaikan peminjaman.

### Scenario 1.5: Anggota Melihat Tabel Riwayat Pengembalian & Denda
- **Tag**: `@regression` `@hybrid`
- **Persona**: Anggota Aktif (`anggota`)
- **Prerequisites (Seed)**: Anggota memiliki minimal 1 data riwayat pinjaman yang sudah dikembalikan (status `Dikembalikan`).
- **Test Type**: UI / Hybrid
- **Target Page Object**: `LoansPage`
- **Langkah-Langkah**:
  1. Masuk ke `/perpus-pinjaman.html`.
  2. Klik tab "Riwayat" (`#tab-riwayat`).
  3. Verifikasi struktur tabel riwayat: Kolom `Buku`, `Dipinjam`, `Dikembalikan`, dan `Denda`.
- **Expected Results**:
  - Tab riwayat aktif (`aria-selected="true"`), dan `#panel-riwayat` terlihat (`hidden=false`).
  - Baris riwayat (`data-testid="history-item"`) menampilkan informasi buku yang dikembalikan secara akurat.
  - Kolom denda menampilkan badge status yang sesuai (`Tepat waktu` atau nominal rupiah dengan label `Lunas`/`Belum dibayar`).

### Scenario 1.6: Pustakawan Menerima Pengembalian Buku Tepat Waktu (Operator Return Loan)
- **Tag**: `@smoke` `@hybrid`
- **Persona**: Pustakawan (`pustakawan`)
- **Prerequisites (Seed)**: Terdapat pinjaman aktif dari anggota yang belum terlambat (`dueDate >= today`).
- **Test Type**: Hybrid
- **Target Page Object**: `LoginPage`, `OperatorLoansPage`, `ConfirmDialogComponent`, `ToastComponent`
- **Langkah-Langkah**:
  1. Login sebagai `pustakawan` dan buka meja layanan (`perpus-operator.html#pinjaman`).
  2. Cari ID pinjaman target via input pencarian pinjaman (`#loan-search`).
  3. Pada baris tabel target (`data-testid="loan-row"`), klik tombol "Terima" (`data-receive`).
  4. Modal konfirmasi pengembalian muncul dengan rincian: "Tepat waktu, tanpa denda."
  5. Klik tombol konfirmasi pada modal.
- **Expected Results**:
  - Modal tertutup dan toast muncul: `"<Judul Buku>" diterima, tepat waktu`.
  - Baris pinjaman tersebut tidak lagi berada di filter "Sedang dipinjam", melainkan berpindah ke filter "Sudah kembali".
  - Stok ketersediaan buku di katalog perpustakaan otomatis bertambah 1 eksemplar.

### Scenario 1.7: Pustakawan Menerima Pengembalian Buku Terlambat dan Menghitung Denda Otomatis
- **Tag**: `@regression` `@hybrid`
- **Persona**: Pustakawan (`pustakawan`)
- **Prerequisites (Seed)**: Seeding pinjaman aktif dengan tanggal jatuh tempo di masa lalu (misal: terlambat 3 hari).
- **Test Type**: Hybrid
- **Target Page Object**: `OperatorLoansPage`, `ConfirmDialogComponent`, `ToastComponent`
- **Langkah-Langkah**:
  1. Masuk ke `perpus-operator.html#pinjaman` sebagai `pustakawan`.
  2. Filter pinjaman dengan opsi "Terlambat" pada dropdown `#loan-filter`.
  3. Verifikasi status badge menunjukkan `"Terlambat X hari, denda Rp X.000"`.
  4. Klik tombol "Terima" pada baris pinjaman terlambat tersebut.
  5. Periksa teks modal konfirmasi penerimaan denda.
  6. Konfirmasi penerimaan buku.
- **Expected Results**:
  - Modal menyebutkan rincian denda: `Buku terlambat X hari. Denda Rp X.000.`
  - Toast mengonfirmasi: `"<Judul Buku>" diterima, denda Rp X.000`.
  - Denda belum dibayar (`unpaidFine`) anggota yang bersangkutan bertambah sejumlah denda tersebut.

### Scenario 1.8: Filter dan Pencarian Pinjaman di Meja Pustakawan
- **Tag**: `@regression`
- **Persona**: Pustakawan (`pustakawan`)
- **Prerequisites (Seed)**: Terdapat kombinasi pinjaman aktif, terlambat, dan selesai di sistem.
- **Test Type**: UI
- **Target Page Object**: `OperatorLoansPage`
- **Langkah-Langkah**:
  1. Masuk ke `perpus-operator.html#pinjaman`.
  2. Pilih filter "Sedang dipinjam", verifikasi seluruh baris yang muncul berstatus pinjam.
  3. Pilih filter "Sudah kembali", verifikasi seluruh baris yang muncul adalah buku yang telah dikembalikan.
  4. Masukkan nama salah satu anggota pada kotak `#loan-search`.
- **Expected Results**:
  - Tabel secara reaktif hanya menampilkan baris pinjaman yang cocok dengan kriteria filter dan kata kunci pencarian.

---

## 3. Test Scenarios (Negatif & Boundary / Edge Cases)

### Scenario 2.1: Akses Unauthenticated ke Halaman Pinjaman (/perpus-pinjaman.html)
- **Tag**: `@regression`
- **Persona**: Tamu Publik (Tanpa Login)
- **Prerequisites (Seed)**: Hapus sesi browser / cookies / localStorage.
- **Test Type**: UI Security Check
- **Target Page Object**: `LoansPage`
- **Langkah-Langkah**:
  1. Buka langsung URL `https://playground.aminhamzah.com/perpus-pinjaman.html`.
  2. Tunggu hingga DOM selesai dimuat.
- **Expected Results**:
  - Elemen `#signed-out-view` ditampilkan (`hidden=false`).
  - Terdapat judul "Kamu belum masuk" dan deskripsi pengingat login.
  - Elemen data pribadi pinjaman (`#loans-view`) disembunyikan (`hidden=true`).
  - Tombol "Ke halaman masuk" (`login-perpus.html`) terlihat dan dapat diklik.

### Scenario 2.2: Akses Pustakawan ke Halaman Pinjaman Anggota (Role Restriction)
- **Tag**: `@regression`
- **Persona**: Pustakawan (`pustakawan`)
- **Prerequisites (Seed)**: Login aktif sebagai pustakawan.
- **Test Type**: UI RBAC Check
- **Target Page Object**: `LoansPage`
- **Langkah-Langkah**:
  1. Login sebagai `pustakawan`.
  2. Navigasikan browser ke URL portal anggota: `/perpus-pinjaman.html`.
- **Expected Results**:
  - Elemen `#denied-view` ditampilkan secara eksklusif.
  - Teks penolakan muncul: `"Akses ditolak. Halaman ini untuk anggota. Pustakawan melihat pinjaman semua anggota di meja layanan."`.
  - Terdapat tombol "Buka meja layanan" yang mengarahkan ke `perpus-operator.html`.
  - Konten pinjaman anggota (`#loans-view`) tidak dirender.

### Scenario 2.3: Buku yang Sudah Pernah Diperpanjang Tidak Dapat Diperpanjang Kembali
- **Tag**: `@regression` `@hybrid`
- **Persona**: Anggota Aktif (`anggota`)
- **Prerequisites (Seed)**: Pinjaman aktif dengan status `extended: true` (sudah pernah diperpanjang 1 kali).
- **Test Type**: UI / Hybrid
- **Target Page Object**: `LoansPage`
- **Langkah-Langkah**:
  1. Masuk ke `/perpus-pinjaman.html`.
  2. Cari kartu pinjaman yang telah diperpanjang sebelumnya.
- **Expected Results**:
  - Tombol "Perpanjang" (`[data-extend]`) TIDAK ADA pada kartu tersebut.
  - Tampil label statis: `<span class="chip muted">Sudah diperpanjang</span>`.
  - Tidak ada cara bagi pengguna untuk memicu permintaan perpanjangan ganda dari antarmuka.

### Scenario 2.4: Pinjaman yang Sudah Melewati Jatuh Tempo Dilarang Diperpanjang
- **Tag**: `@regression` `@hybrid`
- **Persona**: Anggota Aktif (`anggota`)
- **Prerequisites (Seed)**: Pinjaman aktif dengan tanggal jatuh tempo kemarin atau lebih lampau (`dueDate < today`).
- **Test Type**: UI / Hybrid
- **Target Page Object**: `LoansPage`
- **Langkah-Langkah**:
  1. Buka `/perpus-pinjaman.html`.
  2. Periksa kartu pinjaman yang jatuh temponya telah terlewati.
- **Expected Results**:
  - Tombol "Perpanjang" tidak tersedia pada kartu.
  - Tampil chip peringatan instruksi: `<span class="chip muted">Kembalikan ke pustakawan</span>`.

### Scenario 2.5: Anggota Berstatus Diblokir Tidak Dapat Melakukan Perpanjangan
- **Tag**: `@regression`
- **Persona**: Anggota Diblokir (`diblokir`)
- **Prerequisites (Seed)**: Akun anggota memiliki status kartu `Diblokir` (misal akun demo `diblokir`).
- **Test Type**: UI Business Rule Validation
- **Target Page Object**: `LoansPage`
- **Langkah-Langkah**:
  1. Login dengan kredensial akun diblokir (`diblokir` / `baca123`).
  2. Masuk ke halaman `/perpus-pinjaman.html`.
  3. Amati banner peringatan dan tombol aksi pada kartu pinjaman.
- **Expected Results**:
  - Banner peringatan `#blocked-banner` ditampilkan dengan status terlihat: `"Kartumu sedang diblokir pustakawan. Kamu belum bisa meminjam, memperpanjang, atau antre."`.
  - Jika terdapat buku aktif, tombol "Perpanjang" berada dalam keadaan nonaktif (`toBeDisabled()`).

### Scenario 2.6: Pembatalan Interaksi Modal Konfirmasi (User Abort)
- **Tag**: `@regression`
- **Persona**: Anggota Aktif (`anggota`)
- **Prerequisites (Seed)**: Terdapat pinjaman aktif yang dapat diperpanjang.
- **Test Type**: UI Flow
- **Target Page Object**: `LoansPage`, `ConfirmDialogComponent`
- **Langkah-Langkah**:
  1. Klik tombol "Perpanjang" pada kartu buku.
  2. Modal konfirmasi terbuka (`role="dialog"`).
  3. Klik tombol "Batal" (atau tekan tombol Escape).
- **Expected Results**:
  - Modal dialog tertutup seketika.
  - Tidak ada request API extend yang dieksekusi.
  - Tanggal jatuh tempo buku dan status kartu tidak berubah sama sekali.

### Scenario 2.7: Tampilan Empty State Ketika Tidak Ada Pinjaman, Antrean, atau Riwayat
- **Tag**: `@regression`
- **Persona**: Anggota Baru (Tanpa Data Peminjaman)
- **Prerequisites (Seed)**: Akun anggota bersih tanpa pinjaman aktif, antrean, maupun riwayat.
- **Test Type**: UI
- **Target Page Object**: `LoansPage`
- **Langkah-Langkah**:
  1. Masuk ke `/perpus-pinjaman.html`.
  2. Amati tab "Sedang dipinjam".
  3. Buka tab "Antrean".
  4. Buka tab "Riwayat".
- **Expected Results**:
  - Tab "Sedang dipinjam" menampilkan komponen empty: `"Belum ada buku yang dipinjam"` beserta tombol aksi `"Buka katalog"`.
  - Tab "Antrean" menampilkan teks empty: `"Tidak ada antrean"`.
  - Tab "Riwayat" menampilkan teks empty: `"Belum ada riwayat"`.

### Scenario 2.8: Batas Maksimal Pinjaman 3 Buku (Borrowing Limit Boundary)
- **Tag**: `@regression` `@hybrid`
- **Persona**: Anggota Aktif (`anggota`)
- **Prerequisites (Seed)**: Seeding data hingga anggota mencapai limit pinjaman maksimal (3 buku aktif).
- **Test Type**: Hybrid (API Setup + UI Catalog Assertion)
- **Target Page Object**: `CatalogPage`, `BookDetailPage`
- **Langkah-Langkah**:
  1. Buka katalog buku (`perpus-anggota.html`) atau detail buku (`perpus-buku.html`).
  2. Amati tombol aksi peminjaman pada buku yang stoknya masih tersedia.
- **Expected Results**:
  - Pada halaman detail buku, tombol `#borrow-btn` berstatus disabled (`toBeDisabled()`).
  - Pesan aturan `#avail-note` menginformasikan batas limit: `"Kamu sudah meminjam 3 buku. Kembalikan salah satu dulu."`.

### Scenario 2.9: Pencarian Pinjaman Pustakawan Menghasilkan Data Nihil
- **Tag**: `@regression`
- **Persona**: Pustakawan (`pustakawan`)
- **Prerequisites (Seed)**: -
- **Test Type**: UI
- **Target Page Object**: `OperatorLoansPage`
- **Langkah-Langkah**:
  1. Masuk ke meja pustakawan (`perpus-operator.html#pinjaman`).
  2. Ketikkan kata kunci pencarian acak yang tidak mungkin cocok (contoh: `xyz999nonexistent`).
- **Expected Results**:
  - Tabel pinjaman kosong dan menampilkan pesan ramah pengguna: `"Tidak ada pinjaman yang cocok. Ubah kata kunci pencarian."`.

---

## 4. Matriks Ringkasan Skenario Pengujian

| ID Skenario | Judul Skenario | Tag | Persona | Test Type | Prioritas |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-LOAN-01** | Tampilan Ringkasan Statistik dan Kartu Pinjaman Aktif | `@smoke` `@hybrid` | Anggota | Hybrid | P0 |
| **TC-LOAN-02** | Perpanjangan Pinjaman Sukses (Extend Loan Flow) | `@smoke` `@hybrid` | Anggota | Hybrid | P0 |
| **TC-LOAN-03** | Pembatalan Antrean Reservasi Buku | `@regression` `@hybrid` | Anggota | Hybrid | P1 |
| **TC-LOAN-04** | Antrean 'Siap Diambil' Menampilkan Tombol Pinjam | `@regression` `@hybrid` | Anggota | Hybrid | P1 |
| **TC-LOAN-05** | Tampilan Tabel Riwayat & Status Denda | `@regression` | Anggota | UI | P1 |
| **TC-LOAN-06** | Pustakawan Menerima Pengembalian Tepat Waktu | `@smoke` `@hybrid` | Pustakawan | Hybrid | P0 |
| **TC-LOAN-07** | Pustakawan Menerima Pengembalian Terlambat & Denda | `@regression` `@hybrid` | Pustakawan | Hybrid | P1 |
| **TC-LOAN-08** | Filter & Pencarian Meja Pustakawan | `@regression` | Pustakawan | UI | P1 |
| **TC-LOAN-09** | Akses Unauthenticated ke Portal Pinjaman | `@regression` | Publik | UI | P1 |
| **TC-LOAN-10** | Penolakan Akses Pustakawan ke Portal Anggota | `@regression` | Pustakawan | UI | P1 |
| **TC-LOAN-11** | Pencegahan Perpanjangan Ganda (Extended: true) | `@regression` `@hybrid` | Anggota | Hybrid | P1 |
| **TC-LOAN-12** | Pencegahan Perpanjangan Pinjaman Terlambat | `@regression` `@hybrid` | Anggota | Hybrid | P1 |
| **TC-LOAN-13** | Larangan Perpanjangan untuk Anggota Diblokir | `@regression` | Anggota Diblokir | UI | P1 |
| **TC-LOAN-14** | Pembatalan Modal Konfirmasi Perpanjangan (Abort) | `@regression` | Anggota | UI | P2 |
| **TC-LOAN-15** | Tampilan Empty State Pinjaman, Antrean & Riwayat | `@regression` | Anggota Baru | UI | P2 |
| **TC-LOAN-16** | Validasi Batas Maksimal Pinjaman 3 Buku | `@regression` `@hybrid` | Anggota | Hybrid | P1 |
| **TC-LOAN-17** | Pencarian Pinjaman Pustakawan Nihil (No Result) | `@regression` | Pustakawan | UI | P2 |

---

## 5. Implementasi Page Object & Komponen yang Direkomendasikan

Untuk mengotomatisasi skenario di atas sesuai prinsip POM ketat, struktur kelas berikut direkomendasikan untuk dibuat:

```
pages/
├── base.page.ts                   # Base class dengan helper navigasi & web-first waiting
├── login.page.ts                  # Halaman /login-perpus.html
├── loans.page.ts                  # Halaman /perpus-pinjaman.html (Member loans portal)
├── operator-loans.page.ts         # Halaman /perpus-operator.html#pinjaman (Operator loans portal)
├── catalog.page.ts                # Halaman /perpus-anggota.html (Catalog)
├── book-detail.page.ts            # Halaman /perpus-buku.html (Book detail & checkout)
└── components/
    ├── confirm-dialog.component.ts # Modal dialog konfirmasi (role="dialog")
    ├── toast.component.ts         # Toast status (#toast[role="status"])
    └── navbar.component.ts        # Header nav & avatar menu
```
