import { test, expect } from '@fixtures/index';
import { ApiErrorSchema } from '@helpers/schemas/auth.schema';

test.describe('RBAC Security: Role-Based Access Control Matrix', () => {
  // ===========================================================================
  // 1. ANGGOTA RESTRICTIONS (Endpoint khusus Pustakawan harus menolak Anggota)
  // ===========================================================================
  test.describe('1. Anggota Role Restrictions (Must return 403 reason: role)', () => {
    test(
      'Anggota cannot create book in catalog (POST /api/perpus/books)',
      { tag: ['@rbac', '@security', '@member'] },
      async ({ memberRequest }) => {
        const response = await memberRequest.post('/api/perpus/books', {
          data: {
            title: 'Unauthorized Book',
            author: 'Hacker',
            year: 2024,
            category: 'Teknologi',
            copies: 1,
          },
        });

        expect(response.status()).toBe(403);
        const data = await response.json();
        const contract = ApiErrorSchema.safeParse(data);
        expect(contract.success, contract.error?.message).toBe(true);
        expect(data.reason).toBe('role');
      },
    );

    test(
      'Anggota cannot update book copies/data (PATCH /api/perpus/books/{id})',
      { tag: ['@rbac', '@security', '@member'] },
      async ({ memberRequest }) => {
        const response = await memberRequest.patch('/api/perpus/books/13', {
          data: { copies: 10 },
        });

        expect(response.status()).toBe(403);
        const data = await response.json();
        expect(data.reason).toBe('role');
      },
    );

    test(
      'Anggota cannot delete book from catalog (DELETE /api/perpus/books/{id})',
      { tag: ['@rbac', '@security', '@member'] },
      async ({ memberRequest }) => {
        const response = await memberRequest.delete('/api/perpus/books/13');

        expect(response.status()).toBe(403);
        const data = await response.json();
        expect(data.reason).toBe('role');
      },
    );

    test(
      'Anggota cannot view members list (GET /api/perpus/members)',
      { tag: ['@rbac', '@security', '@member'] },
      async ({ memberRequest }) => {
        const response = await memberRequest.get('/api/perpus/members');

        expect(response.status()).toBe(403);
        const data = await response.json();
        expect(data.reason).toBe('role');
      },
    );

    test(
      'Anggota cannot register new member (POST /api/perpus/members)',
      { tag: ['@rbac', '@security', '@member'] },
      async ({ memberRequest }) => {
        const response = await memberRequest.post('/api/perpus/members', {
          data: {
            name: 'New Member',
            username: `unauthorized_${Date.now()}`,
            password: 'secret_password_123',
          },
        });

        expect(response.status()).toBe(403);
        const data = await response.json();
        expect(data.reason).toBe('role');
      },
    );

    test(
      'Anggota cannot view member detail by id (GET /api/perpus/members/{id})',
      { tag: ['@rbac', '@security', '@member'] },
      async ({ memberRequest }) => {
        const response = await memberRequest.get('/api/perpus/members/AGT-1001');

        expect(response.status()).toBe(403);
        const data = await response.json();
        expect(data.reason).toBe('role');
      },
    );

    test(
      'Anggota cannot update member profile or status (PATCH /api/perpus/members/{id})',
      { tag: ['@rbac', '@security', '@member'] },
      async ({ memberRequest }) => {
        const response = await memberRequest.patch('/api/perpus/members/AGT-1001', {
          data: { status: 'Diblokir' },
        });

        expect(response.status()).toBe(403);
        const data = await response.json();
        expect(data.reason).toBe('role');
      },
    );

    test(
      'Anggota cannot delete member (DELETE /api/perpus/members/{id})',
      { tag: ['@rbac', '@security', '@member'] },
      async ({ memberRequest }) => {
        const response = await memberRequest.delete('/api/perpus/members/AGT-1001');

        expect(response.status()).toBe(403);
        const data = await response.json();
        expect(data.reason).toBe('role');
      },
    );

    test(
      'Anggota cannot process book return (POST /api/perpus/loans/{id}/return)',
      { tag: ['@rbac', '@security', '@member'] },
      async ({ memberRequest }) => {
        const response = await memberRequest.post('/api/perpus/loans/PJM-1001/return');

        expect(response.status()).toBe(403);
        const data = await response.json();
        expect(data.reason).toBe('role');
      },
    );

    test(
      'Anggota cannot mark fines as paid (POST /api/perpus/members/{id}/pay-fines)',
      { tag: ['@rbac', '@security', '@member'] },
      async ({ memberRequest }) => {
        const response = await memberRequest.post('/api/perpus/members/AGT-1001/pay-fines');

        expect(response.status()).toBe(403);
        const data = await response.json();
        expect(data.reason).toBe('role');
      },
    );
  });

  // ===========================================================================
  // 2. PUSTAKAWAN RESTRICTIONS (Endpoint khusus Anggota harus menolak Operator)
  // ===========================================================================
  test.describe('2. Pustakawan Role Restrictions (Must return 403 reason: role)', () => {
    test(
      'Pustakawan cannot borrow book (POST /api/perpus/loans)',
      { tag: ['@rbac', '@security', '@operator'] },
      async ({ operatorRequest }) => {
        const response = await operatorRequest.post('/api/perpus/loans', {
          data: { bookId: 13 },
        });

        expect(response.status()).toBe(403);
        const data = await response.json();
        const contract = ApiErrorSchema.safeParse(data);
        expect(contract.success, contract.error?.message).toBe(true);
        expect(data.reason).toBe('role');
      },
    );

    test(
      'Pustakawan cannot queue / reserve a book (POST /api/perpus/books/{id}/reservations)',
      { tag: ['@rbac', '@security', '@operator'] },
      async ({ operatorRequest }) => {
        const response = await operatorRequest.post('/api/perpus/books/13/reservations');

        expect(response.status()).toBe(403);
        const data = await response.json();
        expect(data.reason).toBe('role');
      },
    );

    test(
      'Pustakawan cannot extend a loan (POST /api/perpus/loans/{id}/extend)',
      { tag: ['@rbac', '@security', '@operator'] },
      async ({ operatorRequest }) => {
        const response = await operatorRequest.post('/api/perpus/loans/PJM-1001/extend');

        expect(response.status()).toBe(403);
        const data = await response.json();
        expect(data.reason).toBe('role');
      },
    );

    test(
      'Pustakawan cannot write book review (POST /api/perpus/books/{id}/reviews)',
      { tag: ['@rbac', '@security', '@operator'] },
      async ({ operatorRequest }) => {
        const response = await operatorRequest.post('/api/perpus/books/13/reviews', {
          data: { rating: 5, comment: 'Buku bagus sekali!' },
        });

        expect(response.status()).toBe(403);
        const data = await response.json();
        expect(data.reason).toBe('role');
      },
    );

    test(
      'Pustakawan cannot update member review (PATCH /api/perpus/reviews/{id})',
      { tag: ['@rbac', '@security', '@operator'] },
      async ({ operatorRequest }) => {
        const response = await operatorRequest.patch('/api/perpus/reviews/ULS-1001', {
          data: { rating: 4, comment: 'Diedit operator' },
        });

        expect(response.status()).toBe(403);
        const data = await response.json();
        expect(data.reason).toBe('role');
      },
    );
  });

  // ===========================================================================
  // 3. BLOCKED MEMBER RESTRICTIONS (Anggota Diblokir)
  // ===========================================================================
  test.describe('3. Blocked Member Restrictions (Must return 403 reason: blocked)', () => {
    test(
      'Blocked member cannot borrow book (POST /api/perpus/loans)',
      { tag: ['@rbac', '@security', '@blocked'] },
      async ({ blockedRequest }) => {
        const response = await blockedRequest.post('/api/perpus/loans', {
          data: { bookId: 13 },
        });

        expect(response.status()).toBe(403);
        const data = await response.json();
        expect(data.reason).toBe('blocked');
      },
    );

    test(
      'Member cannot access/extend another member loan (Must return 404 Not Found privacy masking)',
      { tag: ['@rbac', '@security', '@privacy'] },
      async ({ blockedRequest }) => {
        // PJM-1001 belongs to Rina (AGT-1001), not the blocked member
        const response = await blockedRequest.post('/api/perpus/loans/PJM-1001/extend');

        expect(response.status()).toBe(404);
        const data = await response.json();
        expect(data.error).toBeDefined();
      },
    );
  });

  // ===========================================================================
  // 4. PUBLIC RESTRICTIONS (Unauthenticated calls must return 401 reason: missing)
  // ===========================================================================
  test.describe('4. Public Access Enforcement (Must return 401 reason: missing)', () => {
    const protectedEndpoints = [
      { method: 'get', path: '/api/perpus/me' },
      { method: 'get', path: '/api/perpus/books' },
      { method: 'post', path: '/api/perpus/books' },
      { method: 'get', path: '/api/perpus/books/13' },
      { method: 'patch', path: '/api/perpus/books/13' },
      { method: 'delete', path: '/api/perpus/books/13' },
      { method: 'get', path: '/api/perpus/members' },
      { method: 'post', path: '/api/perpus/members' },
      { method: 'get', path: '/api/perpus/members/AGT-1001' },
      { method: 'patch', path: '/api/perpus/members/AGT-1001' },
      { method: 'delete', path: '/api/perpus/members/AGT-1001' },
      { method: 'get', path: '/api/perpus/loans' },
      { method: 'post', path: '/api/perpus/loans' },
      { method: 'get', path: '/api/perpus/loans/PJM-1001' },
      { method: 'post', path: '/api/perpus/loans/PJM-1001/extend' },
      { method: 'post', path: '/api/perpus/loans/PJM-1001/return' },
      { method: 'post', path: '/api/perpus/members/AGT-1001/pay-fines' },
      { method: 'get', path: '/api/perpus/reservations' },
      { method: 'post', path: '/api/perpus/books/13/reservations' },
      { method: 'get', path: '/api/perpus/reviews' },
      { method: 'post', path: '/api/perpus/books/13/reviews' },
    ];

    for (const ep of protectedEndpoints) {
      test(
        `Unauthenticated ${ep.method.toUpperCase()} ${ep.path} must return 401 missing`,
        { tag: ['@rbac', '@security', '@public'] },
        async ({ publicRequest }) => {
          let response;
          switch (ep.method) {
            case 'get':
              response = await publicRequest.get(ep.path);
              break;
            case 'post':
              response = await publicRequest.post(ep.path, { data: {} });
              break;
            case 'patch':
              response = await publicRequest.patch(ep.path, { data: {} });
              break;
            case 'delete':
              response = await publicRequest.delete(ep.path);
              break;
            default:
              throw new Error(`Unsupported method: ${ep.method}`);
          }

          expect(response.status()).toBe(401);
          const data = await response.json();
          expect(data.reason).toBe('missing');
        },
      );
    }
  });

  // ===========================================================================
  // 5. PUBLIC ALLOWED ENDPOINTS (Endpoint yang diizinkan tanpa token)
  // ===========================================================================
  test.describe('5. Public Allowed Endpoints', () => {
    test(
      'POST /api/perpus/logout is accessible publicly and always returns 204',
      { tag: ['@rbac', '@security', '@public'] },
      async ({ publicRequest }) => {
        const response = await publicRequest.post('/api/perpus/logout');
        expect(response.status()).toBe(204);
      },
    );
  });
});
