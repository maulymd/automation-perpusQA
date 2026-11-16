import { test, expect } from '@fixtures/index';
import { ApiErrorSchema, ValidationErrorSchema } from '@helpers/schemas/auth.schema';

test.describe('Negative & Boundary Tests: Autentikasi, Anggota, & Ulasan', () => {
  // ===========================================================================
  // 1. LIBRARY CREATION BOUNDARY (POST /api/perpus/libraries)
  // ===========================================================================
  test.describe('Library Creation Validation Boundary', () => {
    test(
      'should return 422 when library name is too short (< 3 chars)',
      { tag: ['@boundary', '@library', '@negative'] },
      async ({ publicRequest }) => {
        const response = await publicRequest.post('/api/perpus/libraries', {
          data: {
            name: 'AB',
            username: `valid_${Date.now()}`,
            password: 'password123',
          },
        });

        expect(response.status()).toBe(422);
        const data = await response.json();
        const contract = ValidationErrorSchema.safeParse(data);
        expect(contract.success, contract.error?.message).toBe(true);
        expect(data.fields.name).toBeDefined();
      },
    );

    test(
      'should return 422 when username contains uppercase or illegal characters',
      { tag: ['@boundary', '@library', '@negative'] },
      async ({ publicRequest }) => {
        const response = await publicRequest.post('/api/perpus/libraries', {
          data: {
            name: 'Perpustakaan Valid',
            username: 'USER_CAPS!',
            password: 'password123',
          },
        });

        expect(response.status()).toBe(422);
        const data = await response.json();
        expect(data.fields.username).toBeDefined();
      },
    );

    test(
      'should return 422 when password is too short (< 6 chars)',
      { tag: ['@boundary', '@library', '@negative'] },
      async ({ publicRequest }) => {
        const response = await publicRequest.post('/api/perpus/libraries', {
          data: {
            name: 'Perpustakaan Valid',
            username: `user_${Date.now()}`,
            password: '12345',
          },
        });

        expect(response.status()).toBe(422);
        const data = await response.json();
        expect(data.fields.password).toBeDefined();
      },
    );

    test(
      'should return 409 Conflict when library username is already taken',
      { tag: ['@boundary', '@library', '@conflict'] },
      async ({ publicRequest }) => {
        const response = await publicRequest.post('/api/perpus/libraries', {
          data: {
            name: 'Perpustakaan Duplikat',
            username: 'pustakawan',
            password: 'password123',
          },
        });

        expect(response.status()).toBe(409);
        const data = await response.json();
        const contract = ApiErrorSchema.safeParse(data);
        expect(contract.success, contract.error?.message).toBe(true);
        expect(data.error).toContain('sudah dipakai');
      },
    );
  });

  // ===========================================================================
  // 2. MEMBER MANAGEMENT BOUNDARY (POST/PATCH/DELETE /api/perpus/members)
  // ===========================================================================
  test.describe('Member Management Boundary & Locked Demo Accounts', () => {
    test(
      'should return 422 when registering member with name < 2 chars',
      { tag: ['@boundary', '@member', '@negative'] },
      async ({ operatorRequest }) => {
        const response = await operatorRequest.post('/api/perpus/members', {
          data: {
            name: 'A',
            username: `user_${Date.now()}`,
            password: 'password123',
          },
        });

        expect(response.status()).toBe(422);
        const data = await response.json();
        expect(data.fields.name).toBeDefined();
      },
    );

    test(
      'should return 409 Conflict when member username is already taken',
      { tag: ['@boundary', '@member', '@conflict'] },
      async ({ operatorRequest }) => {
        const response = await operatorRequest.post('/api/perpus/members', {
          data: {
            name: 'Budi Santoso',
            username: 'anggota',
            password: 'password123',
          },
        });

        expect(response.status()).toBe(409);
        const data = await response.json();
        expect(data.error).toContain('sudah dipakai');
      },
    );

    test(
      'should return 409 Conflict when attempting to modify locked demo member (AGT-1001)',
      { tag: ['@boundary', '@member', '@conflict'] },
      async ({ operatorRequest }) => {
        const response = await operatorRequest.patch('/api/perpus/members/AGT-1001', {
          data: { name: 'Nama Baru' },
        });

        expect(response.status()).toBe(409);
        const data = await response.json();
        expect(data.error).toContain('dikunci');
      },
    );

    test(
      'should return 409 Conflict when attempting to delete locked demo member (AGT-1001)',
      { tag: ['@boundary', '@member', '@conflict'] },
      async ({ operatorRequest }) => {
        const response = await operatorRequest.delete('/api/perpus/members/AGT-1001');

        expect(response.status()).toBe(409);
        const data = await response.json();
        expect(data.error).toContain('dikunci');
      },
    );

    test(
      'should return 404 Not Found when member ID does not exist',
      { tag: ['@boundary', '@member', '@negative'] },
      async ({ operatorRequest }) => {
        const response = await operatorRequest.get('/api/perpus/members/AGT-9999');
        expect(response.status()).toBe(404);
      },
    );

    test(
      'should return 400 when query status is invalid on GET /api/perpus/members',
      { tag: ['@boundary', '@member', '@negative'] },
      async ({ operatorRequest }) => {
        const response = await operatorRequest.get('/api/perpus/members', {
          params: { status: 'invalid_status' },
        });

        expect(response.status()).toBe(400);
      },
    );
  });

  // ===========================================================================
  // 3. BOOK REVIEWS BOUNDARY (POST /api/perpus/books/{id}/reviews)
  // ===========================================================================
  test.describe('Book Reviews Boundary Validations', () => {
    test(
      'should return 422 when rating is out of range 1-5 (rating=6)',
      { tag: ['@boundary', '@reviews', '@negative'] },
      async ({ memberRequest }) => {
        const response = await memberRequest.post('/api/perpus/books/13/reviews', {
          data: {
            rating: 6,
            comment: 'Rating terlalu tinggi',
          },
        });

        expect(response.status()).toBe(422);
        const data = await response.json();
        const contract = ValidationErrorSchema.safeParse(data);
        expect(contract.success, contract.error?.message).toBe(true);
        expect(data.fields.rating).toBeDefined();
      },
    );

    test(
      'should return 404 when writing review for non-existent book (bookId=99999)',
      { tag: ['@boundary', '@reviews', '@negative'] },
      async ({ memberRequest }) => {
        const response = await memberRequest.post('/api/perpus/books/99999/reviews', {
          data: {
            rating: 5,
            comment: 'Buku tidak ada',
          },
        });

        expect(response.status()).toBe(404);
      },
    );
  });
});
