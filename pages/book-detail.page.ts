import { Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Page Object untuk halaman Detail Buku (`/perpus-buku.html?id=X`).
 */
export class BookDetailPage extends BasePage {
  readonly borrowButton: Locator;
  readonly reserveButton: Locator;
  readonly cancelReservationButton: Locator;
  readonly availabilityStatus: Locator;
  readonly reservationStatus: Locator;
  readonly ruleNote: Locator;
  readonly alertError: Locator;

  constructor(page: Page) {
    super(page);

    this.borrowButton = this.page.locator('#borrow-btn');
    this.reserveButton = this.page.locator('#reserve-btn');
    this.cancelReservationButton = this.page.locator('#cancel-res-btn');
    this.availabilityStatus = this.page.getByTestId('book-availability');
    this.reservationStatus = this.page.getByTestId('reservation-status');
    this.ruleNote = this.page.locator('#avail-note');
    this.alertError = this.page.locator('#avail-error');
  }

  /** Membuka halaman detail buku berdasarkan ID */
  async open(bookId: number | string): Promise<void> {
    await this.goto(`/perpus-buku.html?id=${bookId}`);
  }

  /** Mengklik tombol pinjam */
  async clickBorrow(): Promise<void> {
    await this.borrowButton.click();
  }

  /** Mengklik tombol antre */
  async clickReserve(): Promise<void> {
    await this.reserveButton.click();
  }
}
