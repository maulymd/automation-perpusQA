import { BooksApi } from '@helpers/api/books.api';
import { LoansApi } from '@helpers/api/loans.api';
import { authFixtures } from './auth.fixture';

export interface DomainApiFixtures {
  /** BooksApi helper dengan otentikasi Pustakawan (operator) */
  operatorBooksApi: BooksApi;

  /** BooksApi helper dengan otentikasi Anggota */
  memberBooksApi: BooksApi;

  /** LoansApi helper dengan otentikasi Anggota (untuk pinjam / perpanjang) */
  memberLoansApi: LoansApi;

  /** LoansApi helper dengan otentikasi Pustakawan (untuk terima pengembalian) */
  operatorLoansApi: LoansApi;
}

export const domainApiFixtures = authFixtures.extend<DomainApiFixtures>({
  operatorBooksApi: async ({ operatorRequest }, use) => {
    const api = new BooksApi(operatorRequest);
    await use(api);
  },

  memberBooksApi: async ({ memberRequest }, use) => {
    const api = new BooksApi(memberRequest);
    await use(api);
  },

  memberLoansApi: async ({ memberRequest }, use) => {
    const api = new LoansApi(memberRequest);
    await use(api);
  },

  operatorLoansApi: async ({ operatorRequest }, use) => {
    const api = new LoansApi(operatorRequest);
    await use(api);
  },
});
