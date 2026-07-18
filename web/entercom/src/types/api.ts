export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApplicationResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  pagination?: {
    count: number;
    next: string | null;
    previous: string | null;
  };
}

export type NormalizedResponse<T> = T;
