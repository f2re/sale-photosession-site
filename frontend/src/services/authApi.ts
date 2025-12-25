import api from './api';
import { AuthResponse } from '../types';

export const authApi = {
  // Telegram Widget Auth
  loginWithWidget: async (authData: any): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/telegram-widget', authData);
    return response.data;
  },

  // Code Auth
  requestCode: async (username: string): Promise<{ message: string; expires_in_minutes: number }> => {
    const response = await api.post('/auth/request-code', { username });
    return response.data;
  },

  verifyCode: async (username: string, code: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/verify-code', { username, code });
    return response.data;
  },

  getBotInfo: async (): Promise<{ bot_username: string; bot_name: string; bot_id?: string }> => {
    const response = await api.get('/auth/bot-info');
    return response.data;
  },
};
