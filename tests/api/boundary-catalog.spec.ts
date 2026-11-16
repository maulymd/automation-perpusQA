import { test, expect } from '@fixtures/index';
import { ApiErrorSchema, ValidationErrorSchema } from '@helpers/schemas/auth.schema';

test.describe('Negative & Boundary Tests: Katalog Buku (/api/perpus/books)', () => {
  // ===========================================================================
  // 1. QUERY PARAMETER BOUNDARY VALIDATIONS
  // ===========================================================================
  test.describe('Query Parameters Boundary (GET /api/perpus/books)', () => {
    test(
      'should return 400 when page is less than minimum (page=0)',
      { tag: ['@boundary', '@catalog', '@negative'] },
      async ({ memberBooksApi }) => {
        const response = await memberBooksApi.getBooks({ page: 0 });
        expect(response.status()).toBe(400);

        const data = await response.json();
        const contract = ApiErrorSchema.safeParse(data);
        expect(contract.success, contract.error?.message).toBe(true);
      },
    );

    test(
      'should return 400 when limit exceeds maximum (limit=21)',
      { tag: ['@boundary', '@catalog', '@negative'] },
      async ({ memberBooksApi }) => {
        const response = await memberBooksApi.getBooks({ limit: 21 });
        expect(response.status()).toBe(400);

        const data = await response.json();
        const contract = ApiErrorSchema.safeParse(data);
        expect(contract.success, contract.error?.message).toBe(true);
      },
    );

    test(
      'should return 400 when limit is less than minimum (limit=0)',
      { tag: ['@boundary', '@catalog', '@negative'] },
      async ({ memberBooksApi }) => {
        const response = await memberBooksApi.getBooks({ limit: 0 });
        expect(response.status()).toBe(400);

        const data = await response.json();
        expect(data.error).toBeDefined();
      },
    );

    test(
      'should return 400 when category is invalid',
      { tag: ['@boundary', '@catalog', '@negative'] },
      async ({ memberBooksApi }) => {
        // @ts-expect-error deliberately passing invalid category for boundary test
        const response = await memberBooksApi.getBooks({ category: 'InvalidCategory' });
        expect(response.status()).toBe(400);

        const data = await response.json();
        expect(data.error).toBeDefined();
      },
    );

    test(
      'should return 400 when sort parameter is invalid',
      { tag: ['@boundary', '@catalog', '@negative'] },
      async ({ memberBooksApi }) => {
        // @ts-expect-error deliberately passing invalid sort for boundary test
        const response = await memberBooksApi.getBooks({ sort: 'unsupported_sort' });
        expect(response.status()).toBe(400);

        const data = await response.json();
        expect(data.error).toBeDefined();
      },
    );
  });

  // ===========================================================================
  // 2. CREATE BOOK PAYLOAD BOUNDARY VALIDATIONS
  // ===========================================================================
  test.describe('Create Book Payload Boundary (POST /api/perpus/books)', () => {
    test(
      'should return 422 with year field error when year is below 1500',
      { tag: ['@boundary', '@catalog', '@negative'] },
      async ({ operatorBooksApi }) => {
        const response = await operatorBooksApi.createBook({
          title: 'Buku Kuno',
          author: 'Penulis Sejarah',
          year: 1499,
          category: 'Sejarah',
          copies: 1,
        });

        expect(response.status()).toBe(422);
        const data = await response.json();
        const contract = ValidationErrorSchema.safeParse(data);
        expect(contract.success, contract.error?.message).toBe(true);
        expect(data.fields.year).toBeDefined();
      },
    );

    test(
      'should return 422 with year field error when year is far in the future (e.g. 2099)',
      { tag: ['@boundary', '@catalog', '@negative'] },
      async ({ operatorBooksApi }) => {
        const response = await operatorBooksApi.createBook({
          title: 'Buku Masa Depan',
          author: 'Penulis Fiksi',
          year: 2099,
          category: 'Sains',
          copies: 1,
        });

        expect(response.status()).toBe(422);
        const data = await response.json();
        expect(data.fields.year).toBeDefined();
      },
    );

    test(
      'should return 422 when copies is negative (copies = -1)',
      { tag: ['@boundary', '@catalog', '@negative'] },
      async ({ operatorBooksApi }) => {
        const response = await operatorBooksApi.createBook({
          title: 'Buku Minus',
          author: 'Penulis',
          year: 2024,
          category: 'Teknologi',
          copies: -1,
        });

        expect(response.status()).toBe(422);
        const data = await response.json();
        expect(data.fields.copies).toBeDefined();
      },
    );

    test(
      'should return 422 when copies exceeds maximum (copies = 100)',
      { tag: ['@boundary', '@catalog', '@negative'] },
      async ({ operatorBooksApi }) => {
        const response = await operatorBooksApi.createBook({
          title: 'Buku Terlalu Banyak',
          author: 'Penulis',
          year: 2024,
          category: 'Teknologi',
          copies: 100,
        });

        expect(response.status()).toBe(422);
        const data = await response.json();
        expect(data.fields.copies).toBeDefined();
      },
    );

    test(
      'should return 422 when author is too short (1 char)',
      { tag: ['@boundary', '@catalog', '@negative'] },
      async ({ operatorBooksApi }) => {
        const response = await operatorBooksApi.createBook({
          title: 'Judul Valid',
          author: 'A',
          year: 2024,
          category: 'Fiksi',
          copies: 1,
        });

        expect(response.status()).toBe(422);
        const data = await response.json();
        expect(data.fields.author).toBeDefined();
      },
    );
  });

  // ===========================================================================
  // 3. CONFLICT & INTEGRITY CONSTRAINTS
  // ===========================================================================
  test.describe('Catalog Business Rules Conflicts (409 Conflict)', () => {
    test(
      'should return 409 Conflict when creating a book with duplicate title and author',
      { tag: ['@boundary', '@catalog', '@conflict'] },
      async ({ operatorBooksApi }) => {
        // "Laskar Pelangi" karya Andrea Hirata sudah ada di katalog contoh
        const response = await operatorBooksApi.createBook({
          title: 'Laskar Pelangi',
          author: 'Andrea Hirata',
          year: 2005,
          category: 'Fiksi',
          copies: 1,
        });

        expect(response.status()).toBe(409);
        const data = await response.json();
        const contract = ApiErrorSchema.safeParse(data);
        expect(contract.success, contract.error?.message).toBe(true);
        expect(data.error).toContain('Laskar Pelangi');
      },
    );

    test(
      'should return 409 Conflict when attempting to delete a book that is actively borrowed',
      { tag: ['@boundary', '@catalog', '@conflict'] },
      async ({ operatorBooksApi }) => {
        // Sapiens (ID 8) sedang dipinjam oleh Rina di perpustakaan demo
        const response = await operatorBooksApi.deleteBook(8);
        expect(response.status()).toBe(409);

        const data = await response.json();
        expect(data.error).toContain('dipinjam');
      },
    );
  });

  // ===========================================================================
  // 4. NON-EXISTENT RESOURCE & UPDATE BOUNDARY
  // ===========================================================================
  test.describe('Non-Existent Book & Update Boundary (404 and 422)', () => {
    test(
      'GET /api/perpus/books/{id} returns 404 when book ID does not exist',
      { tag: ['@boundary', '@catalog', '@negative'] },
      async ({ memberBooksApi }) => {
        const response = await memberBooksApi.getBookById(99999);
        expect(response.status()).toBe(404);

        const data = await response.json();
        expect(data.error).toBeDefined();
      },
    );

    test(
      'PATCH /api/perpus/books/{id} returns 422 when body has no fields to update',
      { tag: ['@boundary', '@catalog', '@negative'] },
      async ({ operatorBooksApi }) => {
        const response = await operatorBooksApi.updateBook(13, {});
        expect(response.status()).toBe(422);

        const data = await response.json();
        expect(data.fields).toBeDefined();
      },
    );

    test(
      'DELETE /api/perpus/books/{id} returns 404 when book ID does not exist',
      { tag: ['@boundary', '@catalog', '@negative'] },
      async ({ operatorBooksApi }) => {
        const response = await operatorBooksApi.deleteBook(99999);
        expect(response.status()).toBe(404);
      },
    );
  });
});
