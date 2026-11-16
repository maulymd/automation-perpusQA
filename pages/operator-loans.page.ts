import { Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Page Object untuk meja layanan pustakawan - Tab Pinjaman (`/perpus-operator.html#pinjaman`).
 */
export class OperatorLoansPage extends BasePage {
  readonly statActive: Locator;
  readonly statLate: Locator;
  readonly filterSelect: Locator;
  readonly searchInput: Locator;
  readonly loanRows: Locator;
  readonly emptyMessage: Locator;

  constructor(page: Page) {
    super(page);

    this.statActive = this.page.getByTestId('stat-active');
    this.statLate = this.page.getByTestId('stat-late');
    this.filterSelect = this.page.locator('#loan-filter');
    this.searchInput = this.page.locator('#loan-search');
    this.loanRows = this.page.getByTestId('loan-row');
    this.emptyMessage = this.page.locator('#loans-box .empty');
  }

  /** Membuka meja layanan pustakawan pada tab pinjaman */
  async open(): Promise<void> {
    if (!this.page.url().includes('perpus-operator.html')) {
      await this.goto('/perpus-operator.html#pinjaman');
    }
  }

  /** Memilih opsi filter status: 'aktif' | 'terlambat' | 'selesai' | '' (semua) */
  async filterBy(status: 'aktif' | 'terlambat' | 'selesai' | ''): Promise<void> {
    await this.filterSelect.selectOption(status);
  }

  /** Melakukan pencarian pinjaman */
  async search(query: string): Promise<void> {
    await this.searchInput.fill(query);
  }

  /** Mendapatkan Locator baris pinjaman tertentu */
  getLoanRow(idOrQuery: string): Locator {
    return this.loanRows.filter({ hasText: idOrQuery });
  }

  /** Mendapatkan tombol "Terima" pada baris pinjaman */
  getReceiveButton(idOrQuery: string): Locator {
    return this.getLoanRow(idOrQuery).getByRole('button', { name: /terima/i });
  }

  /** Mendapatkan chip badge status pinjaman pada baris tertentu */
  getStatusChip(idOrQuery: string): Locator {
    return this.getLoanRow(idOrQuery).getByTestId('loan-status');
  }

  /** Mengklik tombol terima pengembalian buku */
  async clickReceive(idOrQuery: string): Promise<void> {
    await this.getReceiveButton(idOrQuery).click();
  }
}
