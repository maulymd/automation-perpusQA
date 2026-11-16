export interface LoginPayload {
  username: string;
  password: string;
}

export interface CreateLibraryPayload {
  name: string;
  username: string;
  password: string;
  operatorName?: string;
}

// Re-export inferred types from Zod Schemas as single source of truth
export type {
  LibrarySummary,
  UserSummary,
  LoginResponse,
  OperatorMe,
  MemberMe,
  MeResponse,
  ApiErrorResponse,
  ValidationErrorResponse,
} from '../../schemas/auth.schema';
