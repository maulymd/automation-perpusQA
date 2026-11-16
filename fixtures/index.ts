import { domainApiFixtures } from './api.fixture';

/**
 * Custom Playwright test fixture utama yang menggabungkan seluruh modul fixture.
 * Selalu import `test` dan `expect` dari `@fixtures/index` di file spec.
 */
export const test = domainApiFixtures;

export { expect } from '@playwright/test';
