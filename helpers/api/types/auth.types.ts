export interface LoginPayload {
  username: string;
  password: string;
}

export interface LibrarySummary {
  id: string;
  name: string;
}

export interface UserSummary {
  id: string;
  username: string;
  name: string;
  role: 'operator' | 'anggota';
  library: LibrarySummary;
}

export interface LoginResponse {
  token: string;
  expiresIn: number;
  user: UserSummary;
}

export interface OperatorMe {
  role: 'operator';
  id: string;
  username: string;
  name: string;
  library: LibrarySummary;
}

export interface MemberMe {
  role: 'anggota';
  id: string;
  username: string;
  name: string;
  status: 'Aktif' | 'Diblokir';
  library: LibrarySummary;
  limit: number;
  loanDays: number;
  finePerDay: number;
  activeLoans: number;
  totalFine: number;
  unpaidFine: number;
  reservationLimit: number;
  activeReservations: number;
}

export type MeResponse = OperatorMe | MemberMe;

export interface CreateLibraryPayload {
  name: string;
  username: string;
  password: string;
  operatorName?: string;
}

export interface ApiErrorResponse {
  error: string;
  reason?: 'missing' | 'invalid' | 'expired' | 'role' | 'blocked' | 'owner' | string;
  fields?: Record<string, string>;
}
