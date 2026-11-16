import { APIRequestContext, APIResponse } from '@playwright/test';
import { CreateBookPayload, UpdateBookPayload } from '../schemas/books.schema';

export class BooksApi {
  constructor(private readonly request: APIRequestContext) {}

  /**
   * Mengambil daftar buku katalog (GET /api/perpus/books)
   */
  async getBooks(params?: {
    q?: string;
    category?: string;
    sort?: 'title_asc' | 'title_desc' | 'year_desc' | 'year_asc';
    page?: number;
    limit?: number;
  }): Promise<APIResponse> {
    return this.request.get('/api/perpus/books', { params });
  }

  /**
   * Mengambil detail buku berdasarkan ID (GET /api/perpus/books/{id})
   */
  async getBookById(id: number): Promise<APIResponse> {
    return this.request.get(`/api/perpus/books/${id}`);
  }

  /**
   * Menambahkan buku baru ke katalog (POST /api/perpus/books) - Operator only
   */
  async createBook(payload: CreateBookPayload): Promise<APIResponse> {
    return this.request.post('/api/perpus/books', {
      data: payload,
    });
  }

  /**
   * Mengubah data / jumlah eksemplar buku (PATCH /api/perpus/books/{id}) - Operator only
   */
  async updateBook(id: number, payload: UpdateBookPayload): Promise<APIResponse> {
    return this.request.patch(`/api/perpus/books/${id}`, {
      data: payload,
    });
  }

  /**
   * Menghapus buku dari katalog (DELETE /api/perpus/books/{id}) - Operator only
   */
  async deleteBook(id: number): Promise<APIResponse> {
    return this.request.delete(`/api/perpus/books/${id}`);
  }
}
