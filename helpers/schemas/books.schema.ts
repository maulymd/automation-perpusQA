import { z } from 'zod';

export const BookCategorySchema = z.enum([
  'Fiksi',
  'Teknologi',
  'Sejarah',
  'Sains',
  'Pengembangan diri',
  'Bisnis',
]);

/**
 * Kontrak Schema untuk 1 entitas Buku
 */
export const BookSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1),
  author: z.string().min(1),
  year: z.number().int(),
  category: BookCategorySchema,
  copies: z.number().int().nonnegative(),
  synopsis: z.string(),
  available: z.number().int().nonnegative(),
  queue: z.number().int().nonnegative(),
  rating: z.number().min(1).max(5).nullable(),
  reviews: z.number().int().nonnegative(),
});

/**
 * Kontrak Schema untuk daftar katalog berpaginasi
 */
export const BookListSchema = z.object({
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  totalPages: z.number().int().nonnegative(),
  data: z.array(BookSchema),
});

/**
 * Payload untuk membuat buku baru (POST /api/perpus/books)
 */
export const CreateBookPayloadSchema = z.object({
  title: z.string().min(1).max(120),
  author: z.string().min(2).max(80),
  year: z.number().int().min(1500),
  category: BookCategorySchema,
  copies: z.number().int().min(0).max(99),
  synopsis: z.string().max(600).optional(),
});

/**
 * Payload untuk update buku (PATCH /api/perpus/books/{id})
 */
export const UpdateBookPayloadSchema = CreateBookPayloadSchema.partial();

export type BookCategory = z.infer<typeof BookCategorySchema>;
export type Book = z.infer<typeof BookSchema>;
export type BookList = z.infer<typeof BookListSchema>;
export type CreateBookPayload = z.infer<typeof CreateBookPayloadSchema>;
export type UpdateBookPayload = z.infer<typeof UpdateBookPayloadSchema>;
