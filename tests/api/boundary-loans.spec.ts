import { test, expect } from '@fixtures/index';
import { ApiErrorSchema, ValidationErrorSchema } from '@helpers/schemas/auth.schema';

test.describe('Negative & Boundary Tests: Peminjaman & Antrean (/loans, /reservations)', () => {
  // ===========================================================================
  // 1. QUERY PARAMETER BOUNDARY VALIDATIONS
  // ===========================================================================
  test.describe('Query Parameters Boundary (GET /api/perpus/loans)', () => {
    test(
      'should return 400 when status parameter is invalid',
      { tag: ['@boundary', '@loans', '@negative'] },
      async ({ memberLoansApi }) => {
        // @ts-expect-error deliberately passing invalid status
        const response = await memberLoansApi.getLoans({ status: 'unsupported_status' });
        expect(response.status()).toBe(400);

        const data = await response.json();
        const contract = ApiErrorSchema.safeParse(data);
        expect(contract.success, contract.error?.message).toBe(true);
      },
    );

    test(
      'should return 400 when limit is less than minimum (limit=0)',
      { tag: ['@boundary', '@loans', '@negative'] },
      async ({ memberLoansApi }) => {
        const response = await memberLoansApi.getLoans({ limit: 0 });
        expect(response.status()).toBe(400);
      },
    );

    test(
      'should return 400 when limit exceeds maximum (limit=51)',
      { tag: ['@boundary', '@loans', '@negative'] },
      async ({ memberLoansApi }) => {
        const response = await memberLoansApi.getLoans({ limit: 51 });
        expect(response.status()).toBe(400);
      },
    );
  });

  // ===========================================================================
  // 2. BORROW BOOK CONSTRAINTS (POST /api/perpus/loans)
  // ===========================================================================
  test.describe('Borrow Book Negative & Conflict Rules', () => {
    test(
      'should return 404 when bookId does not exist (bookId=99999)',
      { tag: ['@boundary', '@loans', '@negative'] },
      async ({ memberLoansApi }) => {
        const response = await memberLoansApi.borrowBook({ bookId: 99999 });
        expect(response.status()).toBe(404);

        const data = await response.json();
        expect(data.error).toContain('tidak ditemukan');
      },
    );

    test(
      'should return 422 when borrowedAt format is invalid (not YYYY-MM-DD)',
      { tag: ['@boundary', '@loans', '@negative'] },
      async ({ memberLoansApi }) => {
        const response = await memberLoansApi.borrowBook({
          bookId: 13,
          borrowedAt: '2026/10/03',
        });

        expect(response.status()).toBe(422);
        const data = await response.json();
        const contract = ValidationErrorSchema.safeParse(data);
        expect(contract.success, contract.error?.message).toBe(true);
        expect(data.fields.borrowedAt).toBeDefined();
      },
    );

    test(
      'should return 409 Conflict when borrowing a book that member currently has on loan',
      { tag: ['@boundary', '@loans', '@conflict'] },
      async ({ memberLoansApi }) => {
        // Ambil ID buku yang sedang dipinjam oleh Rina (akun anggota)
        const myLoansRes = await memberLoansApi.getLoans({ status: 'aktif' });
        const myLoansData = await myLoansRes.json();
        const activeBookId = myLoansData.data?.[0]?.bookId || 8;

        // Mencoba meminjam buku yang sama lagi
        const response = await memberLoansApi.borrowBook({ bookId: activeBookId });
        expect(response.status()).toBe(409);

        const data = await response.json();
        expect(data.error).toContain('sedang meminjam');
      },
    );

    test(
      'should return 409 Conflict when borrowing a book with 0 copies available (ID 7)',
      { tag: ['@boundary', '@loans', '@conflict'] },
      async ({ memberLoansApi }) => {
        // ID 7: "Lessons Learned in Software Testing" memiliki 0 eksemplar
        const response = await memberLoansApi.borrowBook({ bookId: 7 });
        expect(response.status()).toBe(409);

        const data = await response.json();
        expect(data.error).toBeDefined();
      },
    );
  });

  // ===========================================================================
  // 3. EXTEND & RETURN CONSTRAINTS
  // ===========================================================================
  test.describe('Extend & Return Constraints (404 and 409)', () => {
    test(
      'extendLoan returns 404 when loan ID does not exist',
      { tag: ['@boundary', '@loans', '@negative'] },
      async ({ memberLoansApi }) => {
        const response = await memberLoansApi.extendLoan('PJM-9999');
        expect(response.status()).toBe(404);
      },
    );

    test(
      'returnLoan returns 404 when loan ID does not exist',
      { tag: ['@boundary', '@loans', '@negative'] },
      async ({ operatorLoansApi }) => {
        const response = await operatorLoansApi.returnLoan('PJM-9999');
        expect(response.status()).toBe(404);
      },
    );
  });

  // ===========================================================================
  // 4. RESERVATION CONSTRAINTS (POST /api/perpus/books/{id}/reservations)
  // ===========================================================================
  test.describe('Reservation Conflict Rules', () => {
    test(
      'should return 409 Conflict when reserving a book whose copies are still available',
      { tag: ['@boundary', '@reservations', '@conflict'] },
      async ({ memberRequest }) => {
        // ID 13: Atomic Habits memiliki stok tersedia > 0
        const response = await memberRequest.post('/api/perpus/books/13/reservations');
        expect(response.status()).toBe(409);

        const data = await response.json();
        expect(data.error).toContain('masih tersedia');
      },
    );

    test(
      'should return 404 when reserving a non-existent book',
      { tag: ['@boundary', '@reservations', '@negative'] },
      async ({ memberRequest }) => {
        const response = await memberRequest.post('/api/perpus/books/99999/reservations');
        expect(response.status()).toBe(404);
      },
    );
  });
});
