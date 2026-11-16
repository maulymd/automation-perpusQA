import { APIRequestContext, APIResponse } from '@playwright/test';
import { BorrowBookPayload } from '../schemas/loans.schema';

export class LoansApi {
  constructor(private readonly request: APIRequestContext) {}

  /**
   * Mengambil daftar pinjaman (GET /api/perpus/loans)
   */
  async getLoans(params?: {
    status?: 'aktif' | 'terlambat' | 'selesai';
    memberId?: string;
    q?: string;
    page?: number;
    limit?: number;
  }): Promise<APIResponse> {
    return this.request.get('/api/perpus/loans', { params });
  }

  /**
   * Mengambil detail pinjaman berdasarkan ID (GET /api/perpus/loans/{id})
   */
  async getLoanById(id: string): Promise<APIResponse> {
    return this.request.get(`/api/perpus/loans/${id}`);
  }

  /**
   * Meminjam buku (POST /api/perpus/loans) - Anggota only
   */
  async borrowBook(payload: BorrowBookPayload): Promise<APIResponse> {
    return this.request.post('/api/perpus/loans', {
      data: payload,
    });
  }

  /**
   * Memperpanjang masa pinjam buku 7 hari (POST /api/perpus/loans/{id}/extend) - Anggota only
   */
  async extendLoan(id: string): Promise<APIResponse> {
    return this.request.post(`/api/perpus/loans/${id}/extend`);
  }

  /**
   * Menerima pengembalian buku (POST /api/perpus/loans/{id}/return) - Operator only
   */
  async returnLoan(id: string): Promise<APIResponse> {
    return this.request.post(`/api/perpus/loans/${id}/return`);
  }
}
