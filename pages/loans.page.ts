import { Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Page Object untuk halaman Pinjaman Anggota (`/perpus-pinjaman.html`).
 */
export class LoansPage extends BasePage {
  // Views & Access Control
  readonly loansView: Locator;
  readonly signedOutView: Locator;
  readonly deniedView: Locator;
  readonly blockedBanner: Locator;

  // Stat summary row
  readonly loanCount: Locator;
  readonly reservationCount: Locator;
  readonly unpaidFine: Locator;
  readonly totalFine: Locator;

  // Reminders
  readonly remindersBox: Locator;
  readonly reminders: Locator;

  // Tabs & Panels
  readonly activeTab: Locator;
  readonly reservationsTab: Locator;
  readonly historyTab: Locator;
  readonly activePanel: Locator;
  readonly reservationsPanel: Locator;
  readonly historyPanel: Locator;

  // Active Loans tab items
  readonly loanCards: Locator;
  readonly activeEmptyState: Locator;

  // Queue / Reservation tab items
  readonly reservationCards: Locator;
  readonly queueEmptyState: Locator;

  // History tab items
  readonly historyRows: Locator;
  readonly historyEmptyState: Locator;
  readonly pagerInfo: Locator;
  readonly prevPageButton: Locator;
  readonly nextPageButton: Locator;

  constructor(page: Page) {
    super(page);

    this.loansView = this.page.locator('#loans-view');
    this.signedOutView = this.page.locator('#signed-out-view');
    this.deniedView = this.page.locator('#denied-view');
    this.blockedBanner = this.page.getByTestId('blocked-banner');

    this.loanCount = this.page.getByTestId('loan-count');
    this.reservationCount = this.page.getByTestId('reservation-count');
    this.unpaidFine = this.page.getByTestId('unpaid-fine');
    this.totalFine = this.page.getByTestId('total-fine');

    this.remindersBox = this.page.locator('#reminders');
    this.reminders = this.page.getByTestId('reminder');

    this.activeTab = this.page.locator('#tab-aktif');
    this.reservationsTab = this.page.locator('#tab-antrean');
    this.historyTab = this.page.locator('#tab-riwayat');

    this.activePanel = this.page.locator('#panel-aktif');
    this.reservationsPanel = this.page.locator('#panel-antrean');
    this.historyPanel = this.page.locator('#panel-riwayat');

    this.loanCards = this.page.getByTestId('loan-card');
    this.activeEmptyState = this.page.locator('#active-box [data-state="empty"], #active-box .state');

    this.reservationCards = this.page.getByTestId('reservation-card');
    this.queueEmptyState = this.page.locator('#queue-box [data-state="empty"], #queue-box .state');

    this.historyRows = this.page.getByTestId('history-item');
    this.historyEmptyState = this.page.locator('#history-box [data-state="empty"], #history-box .state');
    this.pagerInfo = this.page.getByTestId('pager-info');
    this.prevPageButton = this.page.locator('#history-pager').getByRole('button', { name: /sebelumnya/i });
    this.nextPageButton = this.page.locator('#history-pager').getByRole('button', { name: /berikutnya/i });
  }

  /** Membuka halaman pinjaman saya */
  async open(): Promise<void> {
    await this.goto('/perpus-pinjaman.html');
  }

  /** Berpindah tab tampilan: 'aktif', 'antrean', atau 'riwayat' */
  async switchTab(tab: 'aktif' | 'antrean' | 'riwayat'): Promise<void> {
    if (tab === 'aktif') await this.activeTab.click();
    else if (tab === 'antrean') await this.reservationsTab.click();
    else if (tab === 'riwayat') await this.historyTab.click();
  }

  /** Mendapatkan Locator kartu pinjaman berdasarkan judul buku atau ID pinjaman */
  getLoanCard(idOrTitle: string): Locator {
    return this.loanCards.filter({ hasText: idOrTitle });
  }

  /** Mendapatkan tombol "Perpanjang" pada kartu pinjaman */
  getExtendButton(idOrTitle: string): Locator {
    return this.getLoanCard(idOrTitle).getByRole('button', { name: /perpanjang/i });
  }

  /** Mendapatkan chip status pada kartu pinjaman */
  getLoanStatusBadge(idOrTitle: string): Locator {
    return this.getLoanCard(idOrTitle).getByTestId('loan-status');
  }

  /** Mengklik tombol perpanjang pada kartu pinjaman tertentu */
  async clickExtendLoan(idOrTitle: string): Promise<void> {
    await this.getExtendButton(idOrTitle).click();
  }

  /** Mendapatkan Locator kartu antrean reservasi */
  getReservationCard(idOrTitle: string): Locator {
    return this.reservationCards.filter({ hasText: idOrTitle });
  }

  /** Mendapatkan tombol "Batalkan" antrean */
  getCancelReservationButton(idOrTitle: string): Locator {
    return this.getReservationCard(idOrTitle).getByRole('button', { name: /batalkan/i });
  }

  /** Mendapatkan tombol/link "Pinjam sekarang" pada antrean siap diambil */
  getBorrowNowButton(idOrTitle: string): Locator {
    return this.getReservationCard(idOrTitle).getByRole('link', { name: /pinjam sekarang/i });
  }

  /** Mendapatkan badge status antrean */
  getReservationStatusBadge(idOrTitle: string): Locator {
    return this.getReservationCard(idOrTitle).getByTestId('reservation-status');
  }

  /** Mengklik tombol batalkan antrean */
  async clickCancelReservation(idOrTitle: string): Promise<void> {
    await this.getCancelReservationButton(idOrTitle).click();
  }
}
