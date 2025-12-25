import api from './api';
import type { Package } from '../types';

export const packageApi = {
  getPackages: async (): Promise<Package[]> => {
    const response = await api.get<Package[]>('/packages/');
    return response.data;
  },
};
