export interface User { id: string; email: string; firstName?: string; lastName?: string; role?: string; }
export interface AuthState { user: User | null; token: string | null; isAuthenticated: boolean; }
export interface AuthTokens { access: string; refresh: string; }
