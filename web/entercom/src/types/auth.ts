export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'customer' | 'staff' | 'manager' | 'admin' | 'super_admin';
  permissions: string[];
}

export interface AuthTokens {
  access: string;
  refresh: string;
}
