import { normalizeData } from './normalize';
import { apiClient } from './axios';

export interface Role {
  id: string;
  slug: string;
  name: string;
  description: string;
}

export const rolesApi = {
  list: async (): Promise<Role[]> => {
    const { data } = await apiClient.get<Role[]>('/roles/');
    return normalizeData(data);
  }
};
