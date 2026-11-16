import { test, expect } from '@fixtures/index';
import {
  LoginResponseSchema,
  OperatorMeSchema,
  MemberMeSchema,
  ApiErrorSchema,
} from '@helpers/schemas/auth.schema';

test.describe('API: Authentication & Session (/api/perpus)', () => {
  test.describe('POST /api/perpus/login', () => {
    test(
      'should successfully login as Operator and satisfy LoginResponseSchema contract',
      { tag: ['@smoke', '@api', '@auth', '@contract'] },
      async ({ authApi }) => {
        const username = process.env.OPERATOR_USER || 'pustakawan';
        const password = process.env.OPERATOR_PASS || 'pustaka123';

        const response = await authApi.login({ username, password });
        expect(response.status()).toBe(200);

        const data = await response.json();

        // 🛡️ Contract Schema Validation dengan Zod
        const contract = LoginResponseSchema.safeParse(data);
        expect(contract.success, contract.error?.message).toBe(true);

        if (contract.success) {
          expect(contract.data.user.role).toBe('operator');
          expect(contract.data.user.username).toBe(username);
          expect(contract.data.expiresIn).toBe(28800);
        }
      },
    );

    test(
      'should successfully login as Member and satisfy LoginResponseSchema contract',
      { tag: ['@smoke', '@api', '@auth', '@contract'] },
      async ({ authApi }) => {
        const username = process.env.MEMBER_USER || 'anggota';
        const password = process.env.MEMBER_PASS || 'baca123';

        const response = await authApi.login({ username, password });
        expect(response.status()).toBe(200);

        const data = await response.json();

        // 🛡️ Contract Schema Validation dengan Zod
        const contract = LoginResponseSchema.safeParse(data);
        expect(contract.success, contract.error?.message).toBe(true);

        if (contract.success) {
          expect(contract.data.user.role).toBe('anggota');
          expect(contract.data.user.username).toBe(username);
        }
      },
    );

    test(
      'should return 401 Unauthorized and satisfy ApiErrorSchema when password is wrong',
      { tag: ['@regression', '@api', '@auth', '@contract'] },
      async ({ authApi }) => {
        const response = await authApi.login({
          username: 'pustakawan',
          password: 'wrong_password_123',
        });

        expect(response.status()).toBe(401);
        const data = await response.json();

        // 🛡️ Contract Schema Validation dengan Zod
        const contract = ApiErrorSchema.safeParse(data);
        expect(contract.success, contract.error?.message).toBe(true);
      },
    );

    test(
      'should return 400 Bad Request and satisfy ApiErrorSchema when body is empty',
      { tag: ['@regression', '@api', '@auth', '@contract'] },
      async ({ authApi }) => {
        const response = await authApi.login({
          username: '',
          password: '',
        });

        expect(response.status()).toBe(400);
        const data = await response.json();

        // 🛡️ Contract Schema Validation dengan Zod
        const contract = ApiErrorSchema.safeParse(data);
        expect(contract.success, contract.error?.message).toBe(true);
      },
    );
  });

  test.describe('GET /api/perpus/me', () => {
    test(
      'should return Operator profile and satisfy OperatorMeSchema contract',
      { tag: ['@smoke', '@api', '@auth', '@contract'] },
      async ({ operatorRequest }) => {
        const response = await operatorRequest.get('/api/perpus/me');
        expect(response.status()).toBe(200);

        const data = await response.json();

        // 🛡️ Contract Schema Validation dengan Zod
        const contract = OperatorMeSchema.safeParse(data);
        expect(contract.success, contract.error?.message).toBe(true);

        if (contract.success) {
          expect(contract.data.role).toBe('operator');
          expect(contract.data.username).toBe(process.env.OPERATOR_USER || 'pustakawan');
          expect(contract.data.library.id).toBeDefined();
        }
      },
    );

    test(
      'should return Member profile and satisfy MemberMeSchema contract',
      { tag: ['@smoke', '@api', '@auth', '@contract'] },
      async ({ memberRequest }) => {
        const response = await memberRequest.get('/api/perpus/me');
        expect(response.status()).toBe(200);

        const data = await response.json();

        // 🛡️ Contract Schema Validation dengan Zod
        const contract = MemberMeSchema.safeParse(data);
        expect(contract.success, contract.error?.message).toBe(true);

        if (contract.success) {
          expect(contract.data.role).toBe('anggota');
          expect(contract.data.username).toBe(process.env.MEMBER_USER || 'anggota');
          expect(contract.data.limit).toBe(3);
          expect(contract.data.loanDays).toBe(7);
          expect(contract.data.status).toBe('Aktif');
        }
      },
    );

    test(
      'should return 401 with reason missing and satisfy ApiErrorSchema when called without token',
      { tag: ['@regression', '@api', '@auth', '@contract'] },
      async ({ publicRequest }) => {
        const response = await publicRequest.get('/api/perpus/me');
        expect(response.status()).toBe(401);

        const data = await response.json();

        // 🛡️ Contract Schema Validation dengan Zod
        const contract = ApiErrorSchema.safeParse(data);
        expect(contract.success, contract.error?.message).toBe(true);

        if (contract.success) {
          expect(contract.data.reason).toBe('missing');
        }
      },
    );
  });

  test.describe('POST /api/perpus/logout', () => {
    test(
      'should return 204 No Content and invalidate token (401 reason: invalid)',
      { tag: ['@smoke', '@api', '@auth', '@contract'] },
      async ({ authApi, operatorSession }) => {
        const response = await authApi.logout(operatorSession.token);
        expect(response.status()).toBe(204);

        // Verify that the logged-out token is now rejected with 401
        const meResponse = await authApi.getMe(operatorSession.token);
        expect(meResponse.status()).toBe(401);

        const meData = await meResponse.json();

        // 🛡️ Contract Schema Validation dengan Zod
        const contract = ApiErrorSchema.safeParse(meData);
        expect(contract.success, contract.error?.message).toBe(true);

        if (contract.success) {
          expect(contract.data.reason).toBe('invalid');
        }
      },
    );
  });
});
