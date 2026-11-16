import { test, expect } from '@fixtures/index';

test.describe('Fitur Manajemen Peminjaman Buku (/peminjaman)', () => {
  // ---------------------------------------------------------------------------
  // Skenario Positif (Happy Path & Circulation Flows)
  // ---------------------------------------------------------------------------

  test(
    'TC-LOAN-01: Anggota dapat melihat ringkasan statistik dan daftar pinjaman aktif',
    { tag: ['@smoke', '@hybrid'] },
    async ({ loginPage, loansPage }) => {
      // Arrange: Login sebagai Anggota Aktif
      await loginPage.login('anggota', 'baca123');

      // Act: Buka halaman pinjaman
      await loansPage.open();

      // Assert: Verifikasi elemen ringkasan statistik & kartu pinjaman aktif
      await expect(loansPage.loansView).toBeVisible();
      await expect(loansPage.loanCount).toContainText('dari 3');
      await expect(loansPage.reservationCount).toContainText('dari 2');
      await expect(loansPage.unpaidFine).toBeVisible();

      // Verifikasi kartu pinjaman aktif
      await expect(loansPage.activePanel).toBeVisible();
      await expect(loansPage.loanCards.first()).toBeVisible();
      await expect(loansPage.getLoanStatusBadge('Sapiens')).toBeVisible();
    },
  );

  test(
    'TC-LOAN-02: Anggota berhasil memperpanjang durasi peminjaman buku',
    { tag: ['@smoke', '@hybrid'] },
    async ({ loginPage, loansPage, confirmDialog, toast }) => {
      // Arrange: Login sebagai anggota dan buka halaman pinjaman
      await loginPage.login('anggota', 'baca123');
      await loansPage.open();

      // Pastikan kartu target memiliki tombol perpanjang
      const targetTitle = 'Sapiens';
      const extendBtn = loansPage.getExtendButton(targetTitle);

      // Act & Assert jika buku belum diperpanjang
      if (await extendBtn.isVisible()) {
        await loansPage.clickExtendLoan(targetTitle);

        // Verifikasi dialog modal konfirmasi
        await expect(confirmDialog.dialog).toBeVisible();
        await expect(confirmDialog.title).toContainText('Perpanjang');

        // Konfirmasi perpanjangan
        await confirmDialog.confirm();

        // Verifikasi feedback toast dan perubahan status
        await expect(toast.toast).toBeVisible();
        await expect(toast.toast).toContainText('diperpanjang');
      }

      // Assert: Kartu sekarang memiliki indikator perpanjangan
      await expect(loansPage.getLoanCard(targetTitle)).toBeVisible();
    },
  );

  test(
    'TC-LOAN-03: Anggota dapat berpindah ke tab antrean dan membatalkan antrean',
    { tag: ['@regression', '@hybrid'] },
    async ({ loginPage, loansPage, confirmDialog, toast }) => {
      // Arrange: Login sebagai anggota dan buka halaman pinjaman
      await loginPage.login('anggota', 'baca123');
      await loansPage.open();

      // Act: Berpindah ke tab antrean
      await loansPage.switchTab('antrean');

      // Assert: Panel antrean aktif
      await expect(loansPage.reservationsPanel).toBeVisible();

      // Jika ada kartu antrean aktif, uji alur pembatalan
      const reservationCard = loansPage.reservationCards.first();
      if (await reservationCard.isVisible()) {
        const cancelBtn = reservationCard.getByRole('button', { name: /batalkan/i });
        await cancelBtn.click();

        // Verifikasi modal pembatalan
        await expect(confirmDialog.dialog).toBeVisible();
        await expect(confirmDialog.title).toContainText('Batalkan antrean');

        // Konfirmasi pembatalan
        await confirmDialog.confirm();

        // Verifikasi toast konfirmasi sukses
        await expect(toast.toast).toBeVisible();
        await expect(toast.toast).toContainText('Antrean dibatalkan');
      } else {
        await expect(loansPage.queueEmptyState).toBeVisible();
      }
    },
  );

  test(
    'TC-LOAN-04: Tab antrean menampilkan status dan tombol aksi yang sesuai',
    { tag: ['@regression', '@hybrid'] },
    async ({ loginPage, loansPage }) => {
      // Arrange & Act
      await loginPage.login('anggota', 'baca123');
      await loansPage.open();
      await loansPage.switchTab('antrean');

      // Assert: Panel antrean dimuat dengan benar
      await expect(loansPage.reservationsPanel).toBeVisible();
      const count = await loansPage.reservationCards.count();
      if (count > 0) {
        await expect(loansPage.reservationCards.first()).toBeVisible();
      } else {
        await expect(loansPage.queueEmptyState).toBeVisible();
      }
    },
  );

  test(
    'TC-LOAN-05: Anggota dapat melihat tabel riwayat pengembalian dan status denda',
    { tag: ['@regression'] },
    async ({ loginPage, loansPage }) => {
      // Arrange & Act
      await loginPage.login('anggota', 'baca123');
      await loansPage.open();
      await loansPage.switchTab('riwayat');

      // Assert: Panel riwayat terlihat beserta tabel data
      await expect(loansPage.historyPanel).toBeVisible();
      const rowCount = await loansPage.historyRows.count();
      if (rowCount > 0) {
        await expect(loansPage.historyRows.first()).toBeVisible();
        await expect(loansPage.pagerInfo).toBeVisible();
      } else {
        await expect(loansPage.historyEmptyState).toBeVisible();
      }
    },
  );

  test(
    'TC-LOAN-06: Pustakawan menerima pengembalian buku anggota di meja layanan',
    { tag: ['@smoke', '@hybrid'] },
    async ({ loginPage, operatorLoansPage, confirmDialog, toast }) => {
      // Arrange: Login sebagai Pustakawan
      await loginPage.login('pustakawan', 'pustaka123');
      await operatorLoansPage.open();

      // Assert: Tabel pinjaman pustakawan terlihat
      await expect(operatorLoansPage.loanRows.first()).toBeVisible();

      // Act: Temukan baris pinjaman yang berstatus Dipinjam
      const firstRow = operatorLoansPage.loanRows.first();
      const receiveBtn = firstRow.getByRole('button', { name: /terima/i });

      if (await receiveBtn.isVisible()) {
        await receiveBtn.click();

        // Verifikasi modal dialog pengembalian
        await expect(confirmDialog.dialog).toBeVisible();
        await expect(confirmDialog.title).toContainText('Terima pengembalian');

        // Konfirmasi penerimaan
        await confirmDialog.confirm();

        // Verifikasi toast konfirmasi penerimaan
        await expect(toast.toast).toBeVisible();
        await expect(toast.toast).toContainText('diterima');
      }
    },
  );

  test(
    'TC-LOAN-07: Pustakawan dapat memfilter pinjaman berdasarkan status',
    { tag: ['@regression'] },
    async ({ loginPage, operatorLoansPage }) => {
      // Arrange & Act: Login pustakawan dan buka meja layanan
      await loginPage.login('pustakawan', 'pustaka123');
      await operatorLoansPage.open();

      // Filter: Sedang dipinjam
      await operatorLoansPage.filterBy('aktif');
      await expect(operatorLoansPage.filterSelect).toHaveValue('aktif');

      // Filter: Sudah kembali
      await operatorLoansPage.filterBy('selesai');
      await expect(operatorLoansPage.filterSelect).toHaveValue('selesai');

      // Filter: Semua
      await operatorLoansPage.filterBy('');
      await expect(operatorLoansPage.filterSelect).toHaveValue('');
    },
  );

  test(
    'TC-LOAN-08: Pustakawan dapat mencari pinjaman secara real-time',
    { tag: ['@regression'] },
    async ({ loginPage, operatorLoansPage }) => {
      // Arrange & Act
      await loginPage.login('pustakawan', 'pustaka123');
      await operatorLoansPage.open();

      // Pilih filter semua agar mencakup pinjaman aktif maupun yang telah dikembalikan
      await operatorLoansPage.filterBy('');
      await expect(operatorLoansPage.loanRows.first()).toBeVisible();

      // Act: Cari nama anggota 'Rina'
      await operatorLoansPage.search('Rina');

      // Assert: Baris hasil pencarian menampilkan data yang sesuai
      await expect(operatorLoansPage.getLoanRow('Rina').first()).toBeVisible();
    },
  );

  // ---------------------------------------------------------------------------
  // Skenario Negatif & Boundary (Edge Cases & Access Control)
  // ---------------------------------------------------------------------------

  test(
    'TC-LOAN-09: Pengguna belum login (unauthenticated) ditolak mengakses /perpus-pinjaman.html',
    { tag: ['@regression'] },
    async ({ loansPage }) => {
      // Arrange: Buka halaman pinjaman tanpa sesi otentikasi
      await loansPage.open();

      // Assert: Tampilan penolakan login dimunculkan, data pinjaman disembunyikan
      await expect(loansPage.signedOutView).toBeVisible();
      await expect(loansPage.loansView).toBeHidden();
      await expect(loansPage.signedOutView.getByRole('link', { name: /halaman masuk/i })).toBeVisible();
    },
  );

  test(
    'TC-LOAN-10: Pustakawan dilarang mengakses halaman portal pinjaman anggota',
    { tag: ['@regression'] },
    async ({ loginPage, loansPage }) => {
      // Arrange: Login sebagai pustakawan
      await loginPage.login('pustakawan', 'pustaka123');

      // Act: Akses langsung halaman pinjaman anggota
      await loansPage.open();

      // Assert: Tampilan akses ditolak (#denied-view) ditampilkan
      await expect(loansPage.deniedView).toBeVisible();
      await expect(loansPage.loansView).toBeHidden();
      await expect(loansPage.deniedView.getByRole('link', { name: /meja layanan/i })).toBeVisible();
    },
  );

  test(
    'TC-LOAN-11: Buku yang sudah pernah diperpanjang tidak menampilkan tombol perpanjang lagi',
    { tag: ['@regression', '@hybrid'] },
    async ({ loginPage, loansPage }) => {
      // Arrange
      await loginPage.login('anggota', 'baca123');
      await loansPage.open();

      // Assert: Cari kartu yang berstatus 'Sudah diperpanjang' jika ada
      const extendedChip = loansPage.activePanel.getByText('Sudah diperpanjang');
      if (await extendedChip.isVisible()) {
        const card = loansPage.loanCards.filter({ hasText: 'Sudah diperpanjang' }).first();
        // Tombol perpanjang tidak boleh ada di kartu yang sudah diperpanjang
        await expect(card.getByRole('button', { name: /perpanjang/i })).toBeHidden();
      }
    },
  );

  test(
    'TC-LOAN-12: Anggota berstatus Diblokir dilarang memperpanjang pinjaman',
    { tag: ['@regression'] },
    async ({ loginPage, loansPage }) => {
      // Arrange: Login dengan akun anggota diblokir
      await loginPage.login('diblokir', 'baca123');

      // Act: Buka halaman pinjaman
      await loansPage.open();

      // Assert: Banner pemblokiran aktif dan tombol perpanjang dinonaktifkan
      await expect(loansPage.blockedBanner).toBeVisible();
      await expect(loansPage.blockedBanner).toContainText('diblokir');

      // Jika ada kartu pinjaman, tombol perpanjang harus disabled
      const count = await loansPage.loanCards.count();
      if (count > 0) {
        const extendBtn = loansPage.loanCards.first().getByRole('button', { name: /perpanjang/i });
        if (await extendBtn.isVisible()) {
          await expect(extendBtn).toBeDisabled();
        }
      }
    },
  );

  test(
    'TC-LOAN-13: Pembatalan modal konfirmasi tidak mengubah data peminjaman (User Abort)',
    { tag: ['@regression'] },
    async ({ loginPage, loansPage, confirmDialog }) => {
      // Arrange: Login anggota dan buka halaman pinjaman
      await loginPage.login('anggota', 'baca123');
      await loansPage.open();

      // Act: Buka modal dialog pembatalan antrean atau perpanjangan
      const extendBtn = loansPage.activePanel.getByRole('button', { name: /perpanjang/i }).first();
      if (await extendBtn.isVisible()) {
        await extendBtn.click();
        await expect(confirmDialog.dialog).toBeVisible();

        // Batal
        await confirmDialog.cancel();

        // Assert: Modal tertutup tanpa mengeksekusi request
        await expect(confirmDialog.dialog).toBeHidden();
        await expect(extendBtn).toBeVisible();
      }
    },
  );

  test(
    'TC-LOAN-14: Pencarian pinjaman pustakawan yang tidak ditemukan menampilkan empty state',
    { tag: ['@regression'] },
    async ({ loginPage, operatorLoansPage }) => {
      // Arrange: Login pustakawan
      await loginPage.login('pustakawan', 'pustaka123');
      await operatorLoansPage.open();

      // Act: Cari kata kunci acak
      await operatorLoansPage.search('kata_kunci_acak_yang_tidak_ada_999');

      // Assert: Pesan kosong ditampilkan
      await expect(operatorLoansPage.emptyMessage).toBeVisible();
      await expect(operatorLoansPage.emptyMessage).toContainText('Tidak ada pinjaman yang cocok');
    },
  );

  test(
    'TC-LOAN-15: Halaman detail buku memvalidasi stok dan aturan peminjaman',
    { tag: ['@regression'] },
    async ({ loginPage, bookDetailPage }) => {
      // Arrange: Login anggota
      await loginPage.login('anggota', 'baca123');

      // Act: Buka detail buku ID 1 (Laskar Pelangi)
      await bookDetailPage.open(1);

      // Assert: Validasi ketersediaan dan aturan peminjaman
      await expect(bookDetailPage.availabilityStatus).toBeVisible();
      await expect(bookDetailPage.ruleNote).toBeVisible();
      await expect(bookDetailPage.borrowButton).toBeVisible();
    },
  );
});
