export interface User { id: string; email: string; first_name?: string; last_name?: string; role?: string; mfa_enabled?: boolean; }
export interface AuthState { user: User | null; token: string | null; isAuthenticated: boolean; }
export interface AuthTokens { access: string; refresh: string; }
