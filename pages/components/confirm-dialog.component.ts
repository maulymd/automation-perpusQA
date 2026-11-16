import { Locator, Page } from '@playwright/test';

/**
 * Komponen modal dialog konfirmasi aplikasi PerpusQA (`role="dialog"`).
 * Menangani modal konfirmasi perpanjangan, pembatalan antrean, dan penerimaan pengembalian buku.
 */
export class ConfirmDialogComponent {
  readonly dialog: Locator;
  readonly title: Locator;
  readonly description: Locator;
  readonly confirmButton: Locator;
  readonly cancelButton: Locator;

  constructor(private readonly page: Page) {
    this.dialog = this.page.locator('[role="dialog"]');
    this.title = this.dialog.locator('h2');
    this.description = this.dialog.locator('p');
    this.confirmButton = this.dialog.locator('button[type="submit"], button[data-m="ok"]');
    this.cancelButton = this.dialog.locator('button[data-m="cancel"]');
  }

  /** Mengklik tombol konfirmasi aksi (misal: "Perpanjang", "Batalkan antrean", "Terima") */
  async confirm(): Promise<void> {
    await this.confirmButton.click();
  }

  /** Mengklik tombol pembatalan dialog (misal: "Batal", "Tetap antre") */
  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }
}
