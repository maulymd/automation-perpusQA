import { Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Page Object untuk halaman Login PerpusQA (`/login-perpus.html`).
 */
export class LoginPage extends BasePage {
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.usernameInput = this.page.getByLabel('Username');
    this.passwordInput = this.page.getByLabel('Password');
    this.submitButton = this.page.getByRole('button', { name: 'Masuk' });
    this.errorMessage = this.page.locator('.alert, [role="alert"]');
  }

  /** Membuka halaman login */
  async open(): Promise<void> {
    await this.goto('/login-perpus.html');
  }

  /**
   * Melakukan proses login dengan username dan password,
   * lalu menunggu respons token otentikasi serta redirect URL selesai.
   */
  async login(username: string, password: string): Promise<void> {
    await this.open();
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await Promise.all([
      this.page.waitForResponse((res) => res.url().includes('/api/perpus/login') && res.status() === 200),
      this.submitButton.click(),
    ]);
    await this.page.waitForURL(/perpus-(anggota|operator)\.html/);
  }
}
