import api from './api';
import type { Order } from '../types';

export const paymentApi = {
  createPayment: async (
    packageId: number,
    returnUrl?: string
  ): Promise<{ payment_url: string; order_id: number }> => {
    const response = await api.post('/payments/create', {
      package_id: packageId,
      return_url: returnUrl,
    });
    return response.data;
  },

  getMyOrders: async (): Promise<Order[]> => {
    const response = await api.get<Order[]>('/payments/orders/my');
    return response.data;
  },
};
