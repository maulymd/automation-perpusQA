import { Locator, Page } from '@playwright/test';

/**
 * Komponen Toast notifikasi status aplikasi (`#toast[role="status"]`).
 */
export class ToastComponent {
  readonly toast: Locator;

  constructor(private readonly page: Page) {
    this.toast = this.page.locator('#toast[role="status"], .toast[role="status"]');
  }

  /** Mengambil teks pesan toast */
  async getMessage(): Promise<string> {
    return (await this.toast.textContent())?.trim() ?? '';
  }
}
