import { pageFixtures } from './page.fixture';

/**
 * Custom Playwright test fixture utama yang menggabungkan seluruh modul fixture:
 * - Auth fixtures (operatorSession, memberSession, blockedSession, requests)
 * - Domain API fixtures (operatorBooksApi, memberBooksApi, memberLoansApi, operatorLoansApi)
 * - Page Object fixtures (loginPage, loansPage, operatorLoansPage, catalogPage, bookDetailPage, confirmDialog, toast)
 *
 * Selalu import `test` dan `expect` dari `@fixtures/index` di file spec.
 */
export const test = pageFixtures;

export { expect } from '@playwright/test';
