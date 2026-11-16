import { mergeTests } from '@playwright/test';
import { authFixtures } from './auth.fixture';

/**
 * Custom Playwright test fixture utama yang menggabungkan seluruh modul fixture.
 * Selalu import `test` dan `expect` dari `@fixtures/index` di file spec.
 */
export const test = mergeTests(authFixtures);

export { expect } from '@playwright/test';
