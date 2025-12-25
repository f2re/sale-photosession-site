import api from './api';
import { User, ProcessedImage, StylePreset } from '../types';

export const userApi = {
  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<User>('/users/me');
    return response.data;
  },

  getMyImages: async (limit = 50, offset = 0): Promise<ProcessedImage[]> => {
    const response = await api.get<ProcessedImage[]>('/users/me/images', {
      params: { limit, offset },
    });
    return response.data;
  },

  getMyStylePresets: async (): Promise<StylePreset[]> => {
    const response = await api.get<StylePreset[]>('/users/me/style-presets');
    return response.data;
  },
};
