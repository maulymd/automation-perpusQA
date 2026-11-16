import { z } from 'zod';

/**
 * Schema untuk ringkasan data perpustakaan
 */
export const LibrarySummarySchema = z.object({
  id: z.string(),
  name: z.string(),
});

/**
 * Schema untuk data ringkas user pada respons login
 */
export const UserSummarySchema = z.object({
  id: z.string(),
  username: z.string(),
  name: z.string(),
  role: z.enum(['operator', 'anggota']),
  library: LibrarySummarySchema,
});

/**
 * Kontrak Schema untuk respons POST /api/perpus/login (200 OK)
 */
export const LoginResponseSchema = z.object({
  token: z.string().min(20, 'Token JWT minimal 20 karakter'),
  expiresIn: z.number().int().positive(),
  user: UserSummarySchema,
});

/**
 * Kontrak Schema untuk respons profil Pustakawan (GET /api/perpus/me)
 */
export const OperatorMeSchema = z.object({
  role: z.literal('operator'),
  id: z.string(),
  username: z.string(),
  name: z.string(),
  library: LibrarySummarySchema,
});

/**
 * Kontrak Schema untuk respons profil Anggota (GET /api/perpus/me)
 */
export const MemberMeSchema = z.object({
  role: z.literal('anggota'),
  id: z.string(),
  username: z.string(),
  name: z.string(),
  status: z.enum(['Aktif', 'Diblokir']),
  library: LibrarySummarySchema,
  limit: z.number().int().nonnegative(),
  loanDays: z.number().int().positive(),
  finePerDay: z.number().int().nonnegative(),
  activeLoans: z.number().int().nonnegative(),
  totalFine: z.number().int().nonnegative(),
  unpaidFine: z.number().int().nonnegative(),
  reservationLimit: z.number().int().nonnegative(),
  activeReservations: z.number().int().nonnegative(),
});

/**
 * Schema gabungan profil /api/perpus/me (Discriminated by role)
 */
export const MeResponseSchema = z.discriminatedUnion('role', [
  OperatorMeSchema,
  MemberMeSchema,
]);

/**
 * Kontrak Schema untuk respons error standar (400, 401, 403, 404, 409)
 */
export const ApiErrorSchema = z.object({
  error: z.string().min(1, 'Pesan error tidak boleh kosong'),
  reason: z
    .enum(['missing', 'invalid', 'expired', 'role', 'blocked', 'owner'])
    .optional(),
});

/**
 * Kontrak Schema untuk respons validation error (422 Unprocessable Content)
 */
export const ValidationErrorSchema = z.object({
  error: z.string().min(1),
  fields: z.record(z.string(), z.string()),
});

// Infer TypeScript types dari Zod Schemas agar source of truth tetap satu
export type LibrarySummary = z.infer<typeof LibrarySummarySchema>;
export type UserSummary = z.infer<typeof UserSummarySchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type OperatorMe = z.infer<typeof OperatorMeSchema>;
export type MemberMe = z.infer<typeof MemberMeSchema>;
export type MeResponse = z.infer<typeof MeResponseSchema>;
export type ApiErrorResponse = z.infer<typeof ApiErrorSchema>;
export type ValidationErrorResponse = z.infer<typeof ValidationErrorSchema>;
