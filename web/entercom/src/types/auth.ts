export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'customer' | 'staff' | 'manager' | 'admin' | 'super_admin';
  permissions: string[];
  phone_number?: string;
  address?: string;
  profile_image?: string;
  mfa_enabled?: boolean;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}
