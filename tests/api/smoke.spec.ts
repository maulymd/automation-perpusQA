import { test, expect } from '@fixtures/index';
import { BookSchema, BookListSchema } from '@helpers/schemas/books.schema';
import { LoanSchema, LoanListSchema } from '@helpers/schemas/loans.schema';

test.describe('P0 Smoke Test: Core Circulation & Healthcheck', () => {
  test(
    '[P0-SMOKE-01] Catalog Healthcheck: Should retrieve catalog books with valid schema',
    { tag: ['@smoke', '@p0', '@catalog'] },
    async ({ memberBooksApi }) => {
      const response = await memberBooksApi.getBooks({ page: 1, limit: 5 });
      expect(response.status()).toBe(200);

      const data = await response.json();
      const contract = BookListSchema.safeParse(data);
      expect(contract.success, contract.error?.message).toBe(true);

      if (contract.success) {
        expect(contract.data.data.length).toBeGreaterThan(0);
        expect(contract.data.total).toBeGreaterThan(0);
      }
    },
  );

  test(
    '[P0-SMOKE-02] Loans Healthcheck: Should retrieve loans list with valid schema',
    { tag: ['@smoke', '@p0', '@loans'] },
    async ({ memberLoansApi }) => {
      const response = await memberLoansApi.getLoans({ page: 1, limit: 5 });
      expect(response.status()).toBe(200);

      const data = await response.json();
      const contract = LoanListSchema.safeParse(data);
      expect(contract.success, contract.error?.message).toBe(true);
    },
  );

  test(
    '[P0-SMOKE-03] Golden Flow: Complete Circulation Lifecycle (Create Book -> Borrow -> Return -> Delete)',
    { tag: ['@smoke', '@p0', '@circulation'] },
    async ({ operatorBooksApi, memberBooksApi, memberLoansApi, operatorLoansApi }) => {
      const timestamp = Date.now();
      const bookPayload = {
        title: `Smoke Test Playwright ${timestamp}`,
        author: 'QA Automation Engineer',
        year: 2024,
        category: 'Teknologi' as const,
        copies: 2,
        synopsis: 'Buku uji otomatis untuk memverifikasi alur P0 Golden Flow.',
      };

      // -----------------------------------------------------------------------
      // Step 1: Pustakawan menambahkan buku baru ke katalog
      // -----------------------------------------------------------------------
      const createRes = await operatorBooksApi.createBook(bookPayload);
      expect(createRes.status()).toBe(201);

      const createdBook = await createRes.json();
      const bookContract = BookSchema.safeParse(createdBook);
      expect(bookContract.success, bookContract.error?.message).toBe(true);

      const bookId = createdBook.id;
      expect(createdBook.title).toBe(bookPayload.title);
      expect(createdBook.available).toBe(2);
      expect(createdBook.copies).toBe(2);

      try {
        // -----------------------------------------------------------------------
        // Step 2: Anggota mencari dan menemukan buku yang baru dibuat
        // -----------------------------------------------------------------------
        const searchRes = await memberBooksApi.getBooks({ q: bookPayload.title });
        expect(searchRes.status()).toBe(200);

        const searchData = await searchRes.json();
        const found = searchData.data.find((b: { id: number }) => b.id === bookId);
        expect(found).toBeDefined();
        expect(found.available).toBe(2);

        // -----------------------------------------------------------------------
        // Step 3: Anggota meminjam buku tersebut
        // -----------------------------------------------------------------------
        const borrowRes = await memberLoansApi.borrowBook({ bookId });
        expect(borrowRes.status()).toBe(201);

        const loanData = await borrowRes.json();
        const loanContract = LoanSchema.safeParse(loanData);
        expect(loanContract.success, loanContract.error?.message).toBe(true);

        const loanId = loanData.id;
        expect(loanData.bookId).toBe(bookId);
        expect(loanData.status).toBe('Dipinjam');
        expect(loanData.extended).toBe(false);

        // -----------------------------------------------------------------------
        // Step 4: Verifikasi stok buku berkurang setelah dipinjam (2 -> 1)
        // -----------------------------------------------------------------------
        const verifyStockRes = await memberBooksApi.getBookById(bookId);
        expect(verifyStockRes.status()).toBe(200);
        const bookAfterBorrow = await verifyStockRes.json();
        expect(bookAfterBorrow.available).toBe(1);

        // -----------------------------------------------------------------------
        // Step 5: Pustakawan menerima pengembalian buku
        // -----------------------------------------------------------------------
        const returnRes = await operatorLoansApi.returnLoan(loanId);
        expect(returnRes.status()).toBe(200);

        const returnData = await returnRes.json();
        const returnContract = LoanSchema.safeParse(returnData);
        expect(returnContract.success, returnContract.error?.message).toBe(true);
        expect(returnData.status).toBe('Dikembalikan');
        expect(returnData.returnedAt).not.toBeNull();

        // -----------------------------------------------------------------------
        // Step 6: Verifikasi stok buku kembali utuh (1 -> 2)
        // -----------------------------------------------------------------------
        const verifyRestoredRes = await operatorBooksApi.getBookById(bookId);
        expect(verifyRestoredRes.status()).toBe(200);
        const bookAfterReturn = await verifyRestoredRes.json();
        expect(bookAfterReturn.available).toBe(2);
      } finally {
        // -----------------------------------------------------------------------
        // Cleanup: Hapus buku uji agar data perpustakaan tetap bersih
        // -----------------------------------------------------------------------
        const deleteRes = await operatorBooksApi.deleteBook(bookId);
        expect(deleteRes.status()).toBe(204);

        // Verifikasi buku sudah benar-benar terhapus (404)
        const checkDeletedRes = await operatorBooksApi.getBookById(bookId);
        expect(checkDeletedRes.status()).toBe(404);
      }
    },
  );
});
