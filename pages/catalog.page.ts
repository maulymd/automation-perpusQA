import { Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Page Object untuk halaman Katalog Buku Anggota (`/perpus-anggota.html`).
 */
export class CatalogPage extends BasePage {
  readonly searchInput: Locator;
  readonly categorySelect: Locator;
  readonly bookCards: Locator;
  readonly bookCount: Locator;
  readonly blockedBanner: Locator;

  constructor(page: Page) {
    super(page);

    this.searchInput = this.page.locator('#search');
    this.categorySelect = this.page.locator('#category');
    this.bookCards = this.page.getByTestId('book-card');
    this.bookCount = this.page.getByTestId('book-count');
    this.blockedBanner = this.page.locator('#blocked-banner');
  }

  /** Membuka halaman katalog */
  async open(): Promise<void> {
    await this.goto('/perpus-anggota.html');
  }

  /** Melakukan pencarian buku */
  async search(query: string): Promise<void> {
    await this.searchInput.fill(query);
  }

  /** Mendapatkan Locator kartu buku */
  getBookCard(titleOrId: string): Locator {
    return this.bookCards.filter({ hasText: titleOrId });
  }

  /** Mendapatkan tombol "Pinjam" pada kartu buku */
  getBorrowButton(titleOrId: string): Locator {
    return this.getBookCard(titleOrId).getByRole('button', { name: /pinjam/i });
  }

  /** Mendapatkan tombol "Antre" pada kartu buku */
  getReserveButton(titleOrId: string): Locator {
    return this.getBookCard(titleOrId).getByRole('button', { name: /antre/i });
  }

  /** Mendapatkan badge ketersediaan buku */
  getAvailabilityBadge(titleOrId: string): Locator {
    return this.getBookCard(titleOrId).getByTestId('book-availability');
  }

  /** Mengklik tombol Pinjam pada buku tertentu */
  async clickBorrow(titleOrId: string): Promise<void> {
    await this.getBorrowButton(titleOrId).click();
  }
}
