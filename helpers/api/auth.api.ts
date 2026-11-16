import { APIRequestContext, APIResponse } from '@playwright/test';
import {
  LoginPayload,
  LoginResponse,
  CreateLibraryPayload,
  MeResponse,
} from './types/auth.types';

export class AuthApi {
  constructor(private readonly request: APIRequestContext) {}

  /**
   * Kirim request login ke /api/perpus/login
   */
  async login(payload: LoginPayload): Promise<APIResponse> {
    return this.request.post('/api/perpus/login', {
      data: payload,
    });
  }

  /**
   * Login dan langsung mengembalikan data LoginResponse (token & user)
   */
  async loginSuccess(payload: LoginPayload): Promise<LoginResponse> {
    const response = await this.login(payload);
    if (!response.ok()) {
      const err = await response.text();
      throw new Error(`Login failed for ${payload.username} (status ${response.status()}): ${err}`);
    }
    return response.json();
  }

  /**
   * Login sebagai Pustakawan (Operator) menggunakan kredensial dari .env
   */
  async loginAsOperator(): Promise<LoginResponse> {
    const username = process.env.OPERATOR_USER || 'pustakawan';
    const password = process.env.OPERATOR_PASS || 'pustaka123';
    return this.loginSuccess({ username, password });
  }

  /**
   * Login sebagai Anggota Aktif menggunakan kredensial dari .env
   */
  async loginAsMember(): Promise<LoginResponse> {
    const username = process.env.MEMBER_USER || 'anggota';
    const password = process.env.MEMBER_PASS || 'baca123';
    return this.loginSuccess({ username, password });
  }

  /**
   * Login sebagai Anggota Diblokir menggunakan kredensial dari .env
   */
  async loginAsBlocked(): Promise<LoginResponse> {
    const username = process.env.BLOCKED_USER || 'diblokir';
    const password = process.env.BLOCKED_PASS || 'baca123';
    return this.loginSuccess({ username, password });
  }

  /**
   * Ambil profil pemilik sesi melalui GET /api/perpus/me
   */
  async getMe(token?: string): Promise<APIResponse> {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return this.request.get('/api/perpus/me', { headers });
  }

  /**
   * Ambil profil pemilik sesi dan parse JSON
   */
  async getMeSuccess(token: string): Promise<MeResponse> {
    const response = await this.getMe(token);
    if (!response.ok()) {
      throw new Error(`getMe failed (status ${response.status()}): ${await response.text()}`);
    }
    return response.json();
  }

  /**
   * Logout untuk mematikan token sesi lewat POST /api/perpus/logout
   */
  async logout(token?: string): Promise<APIResponse> {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return this.request.post('/api/perpus/logout', { headers });
  }

  /**
   * Membuat perpustakaan sandbox baru (POST /api/perpus/libraries)
   */
  async createLibrary(payload: CreateLibraryPayload): Promise<APIResponse> {
    return this.request.post('/api/perpus/libraries', {
      data: payload,
    });
  }
}
