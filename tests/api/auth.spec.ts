import { test, expect } from '@fixtures/index';
import { ApiErrorResponse, MeResponse } from '@helpers/api/types/auth.types';

test.describe('API: Authentication & Session (/api/perpus)', () => {
  test.describe('POST /api/perpus/login', () => {
    test(
      'should successfully login as Operator (Pustakawan) with valid credentials',
      { tag: ['@smoke', '@api', '@auth'] },
      async ({ authApi }) => {
        const username = process.env.OPERATOR_USER || 'pustakawan';
        const password = process.env.OPERATOR_PASS || 'pustaka123';

        const response = await authApi.login({ username, password });
        expect(response.status()).toBe(200);

        const data = await response.json();
        expect(data).toHaveProperty('token');
        expect(typeof data.token).toBe('string');
        expect(data.token.length).toBeGreaterThan(20);
        expect(data.expiresIn).toBe(28800);
        expect(data.user.role).toBe('operator');
        expect(data.user.username).toBe(username);
      },
    );

    test(
      'should successfully login as Member (Anggota) with valid credentials',
      { tag: ['@smoke', '@api', '@auth'] },
      async ({ authApi }) => {
        const username = process.env.MEMBER_USER || 'anggota';
        const password = process.env.MEMBER_PASS || 'baca123';

        const response = await authApi.login({ username, password });
        expect(response.status()).toBe(200);

        const data = await response.json();
        expect(data).toHaveProperty('token');
        expect(data.user.role).toBe('anggota');
        expect(data.user.username).toBe(username);
      },
    );

    test(
      'should return 401 Unauthorized when password is incorrect',
      { tag: ['@regression', '@api', '@auth'] },
      async ({ authApi }) => {
        const response = await authApi.login({
          username: 'pustakawan',
          password: 'wrong_password_123',
        });

        expect(response.status()).toBe(401);
        const data: ApiErrorResponse = await response.json();
        expect(data.error).toBeDefined();
      },
    );

    test(
      'should return 400 Bad Request when username or password is empty',
      { tag: ['@regression', '@api', '@auth'] },
      async ({ authApi }) => {
        const response = await authApi.login({
          username: '',
          password: '',
        });

        expect(response.status()).toBe(400);
        const data: ApiErrorResponse = await response.json();
        expect(data.error).toBeDefined();
      },
    );
  });

  test.describe('GET /api/perpus/me', () => {
    test(
      'should return operator profile when authenticated as Operator via fixture',
      { tag: ['@smoke', '@api', '@auth'] },
      async ({ operatorRequest }) => {
        const response = await operatorRequest.get('/api/perpus/me');
        expect(response.status()).toBe(200);

        const data: MeResponse = await response.json();
        expect(data.role).toBe('operator');
        expect(data.username).toBe(process.env.OPERATOR_USER || 'pustakawan');
        expect(data.library).toHaveProperty('id');
      },
    );

    test(
      'should return member profile with loan limits when authenticated as Member via fixture',
      { tag: ['@smoke', '@api', '@auth'] },
      async ({ memberRequest }) => {
        const response = await memberRequest.get('/api/perpus/me');
        expect(response.status()).toBe(200);

        const data: MeResponse = await response.json();
        expect(data.role).toBe('anggota');
        expect(data.username).toBe(process.env.MEMBER_USER || 'anggota');
        if (data.role === 'anggota') {
          expect(data.limit).toBe(3);
          expect(data.loanDays).toBe(7);
          expect(data.status).toBe('Aktif');
        }
      },
    );

    test(
      'should return 401 with reason missing when called without token via publicRequest',
      { tag: ['@regression', '@api', '@auth'] },
      async ({ publicRequest }) => {
        const response = await publicRequest.get('/api/perpus/me');
        expect(response.status()).toBe(401);

        const data: ApiErrorResponse = await response.json();
        expect(data.reason).toBe('missing');
        expect(data.error).toBeDefined();
      },
    );
  });

  test.describe('POST /api/perpus/logout', () => {
    test(
      'should return 204 No Content when logging out active session',
      { tag: ['@smoke', '@api', '@auth'] },
      async ({ authApi, operatorSession }) => {
        const response = await authApi.logout(operatorSession.token);
        expect(response.status()).toBe(204);

        // Verify that the logged-out token is now rejected with 401 (reason: invalid)
        const meResponse = await authApi.getMe(operatorSession.token);
        expect(meResponse.status()).toBe(401);
        const meData: ApiErrorResponse = await meResponse.json();
        expect(meData.reason).toBe('invalid');
      },
    );
  });
});
