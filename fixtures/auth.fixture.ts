import { test as base, APIRequestContext } from '@playwright/test';
import { AuthApi } from '@helpers/api/auth.api';
import { LoginResponse } from '@helpers/api/types/auth.types';

export interface AuthFixtures {
  /** Helper auth untuk pemanggilan API login, me, logout langsung */
  authApi: AuthApi;

  /** Token & data user sesi login Pustakawan */
  operatorSession: LoginResponse;

  /** Token & data user sesi login Anggota Aktif */
  memberSession: LoginResponse;

  /** Token & data user sesi login Anggota Diblokir */
  blockedSession: LoginResponse;

  /** API Request Context yang sudah otomatis membawa Header Bearer Token Pustakawan */
  operatorRequest: APIRequestContext;

  /** API Request Context yang sudah otomatis membawa Header Bearer Token Anggota */
  memberRequest: APIRequestContext;

  /** API Request Context yang sudah otomatis membawa Header Bearer Token Anggota Diblokir */
  blockedRequest: APIRequestContext;

  /** API Request Context tanpa token (Publik/Unauthenticated) */
  publicRequest: APIRequestContext;
}

export const authFixtures = base.extend<AuthFixtures>({
  authApi: async ({ request }, use) => {
    const api = new AuthApi(request);
    await use(api);
  },

  operatorSession: async ({ authApi }, use) => {
    const session = await authApi.loginAsOperator();
    await use(session);
  },

  memberSession: async ({ authApi }, use) => {
    const session = await authApi.loginAsMember();
    await use(session);
  },

  blockedSession: async ({ authApi }, use) => {
    const session = await authApi.loginAsBlocked();
    await use(session);
  },

  operatorRequest: async ({ playwright, operatorSession }, use) => {
    const context = await playwright.request.newContext({
      baseURL: process.env.BASE_URL || 'https://playground.aminhamzah.com',
      extraHTTPHeaders: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${operatorSession.token}`,
      },
    });
    await use(context);
    await context.dispose();
  },

  memberRequest: async ({ playwright, memberSession }, use) => {
    const context = await playwright.request.newContext({
      baseURL: process.env.BASE_URL || 'https://playground.aminhamzah.com',
      extraHTTPHeaders: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${memberSession.token}`,
      },
    });
    await use(context);
    await context.dispose();
  },

  blockedRequest: async ({ playwright, blockedSession }, use) => {
    const context = await playwright.request.newContext({
      baseURL: process.env.BASE_URL || 'https://playground.aminhamzah.com',
      extraHTTPHeaders: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${blockedSession.token}`,
      },
    });
    await use(context);
    await context.dispose();
  },

  publicRequest: async ({ playwright }, use) => {
    const context = await playwright.request.newContext({
      baseURL: process.env.BASE_URL || 'https://playground.aminhamzah.com',
      extraHTTPHeaders: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    await use(context);
    await context.dispose();
  },
});
