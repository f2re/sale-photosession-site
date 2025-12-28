import api from './api';
import type { AuthResponse } from '../types';

export const authApi = {
  // Telegram Widget Auth
  loginWithWidget: async (authData: any): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/telegram-widget', authData);
    return response.data;
  },

  // Code Auth
  requestCode: async (username: string): Promise<{ message: string; expires_in_minutes: number }> => {
    console.log('authApi.requestCode called with username:', username);
    const requestData = { username: username };
    console.log('Sending request data:', JSON.stringify(requestData));
    const response = await api.post('/auth/request-code', requestData, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    console.log('Response received:', response);
    return response.data;
  },

  verifyCode: async (username: string, code: string): Promise<AuthResponse> => {
    console.log('authApi.verifyCode called with:', { username, code });
    const requestData = { username, code };
    const response = await api.post<AuthResponse>('/auth/verify-code', requestData, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    return response.data;
  },

  getBotInfo: async (): Promise<{ bot_username: string; bot_name: string; bot_id?: string }> => {
    const response = await api.get('/auth/bot-info');
    return response.data;
  },
};
