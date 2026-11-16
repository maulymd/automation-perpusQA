import { Page } from '@playwright/test';

/**
 * Base Page Object yang menjadi induk bagi seluruh Page Object di aplikasi.
 * Menyediakan utilitas umum navigasi dan helper otentikasi browser.
 */
export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  /** Navigasi ke relative path atau full URL */
  async goto(path: string): Promise<void> {
    await this.page.goto(path);
  }

  /** Mendapatkan URL halaman saat ini */
  getUrl(): string {
    return this.page.url();
  }

  /** Mendapatkan title dokumen */
  async getTitle(): Promise<string> {
    return this.page.title();
  }

  /**
   * Mengatur token otentikasi PerpusQA langsung ke localStorage.
   * Digunakan untuk hybrid fast-login tanpa harus melalui form UI di setiap skenario.
   */
  async setAuthToken(token: string): Promise<void> {
    await this.page.addInitScript((jwtToken: string) => {
      window.localStorage.setItem('perpusqa_token', jwtToken);
    }, token);
  }

  /** Menghapus token otentikasi dari localStorage */
  async clearAuthToken(): Promise<void> {
    await this.page.evaluate(() => {
      window.localStorage.removeItem('perpusqa_token');
    });
  }
}
