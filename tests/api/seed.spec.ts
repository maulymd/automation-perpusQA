import { test, expect } from '@fixtures/index';

test.describe('Seed Data Setup', () => {
  test('seed API verification', async ({ operatorRequest }) => {
    // Verifikasi konektivitas seed data via API
    const response = await operatorRequest.get('/api/perpus/me');
    expect(response.status()).toBe(200);
  });
});
