import { z } from 'zod';

export const LoanStatusSchema = z.enum(['Dipinjam', 'Dikembalikan']);

/**
 * Kontrak Schema untuk 1 data Pinjaman
 */
export const LoanSchema = z.object({
  id: z.string().regex(/^PJM-\d+$/, 'Format ID pinjaman harus PJM-xxxx'),
  bookId: z.number().int().positive(),
  title: z.string().min(1),
  author: z.string().min(1),
  memberId: z.string().regex(/^AGT-\d+$/, 'Format ID anggota harus AGT-xxxx'),
  memberName: z.string().min(1),
  borrowedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal YYYY-MM-DD'),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal YYYY-MM-DD'),
  extended: z.boolean(),
  status: LoanStatusSchema,
  returnedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  daysLeft: z.number().int().nullable(),
  lateDays: z.number().int().nonnegative(),
  fine: z.number().int().nonnegative(),
  finePaid: z.boolean(),
});

/**
 * Kontrak Schema untuk daftar pinjaman
 */
export const LoanListSchema = z.object({
  total: z.number().int().nonnegative(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().optional(),
  totalPages: z.number().int().nonnegative().optional(),
  data: z.array(LoanSchema),
});

/**
 * Payload untuk meminjam buku (POST /api/perpus/loans)
 */
export const BorrowBookPayloadSchema = z.object({
  bookId: z.number().int().positive(),
  borrowedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export type LoanStatus = z.infer<typeof LoanStatusSchema>;
export type Loan = z.infer<typeof LoanSchema>;
export type LoanList = z.infer<typeof LoanListSchema>;
export type BorrowBookPayload = z.infer<typeof BorrowBookPayloadSchema>;
