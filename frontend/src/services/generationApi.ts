import api from './api';
import { ProcessedImage, StylePreset } from '../types';

export const generationApi = {
  createGeneration: async (data: {
    image_base64: string;
    style_name?: string;
    custom_prompt?: string;
    aspect_ratio?: string;
    style_preset_id?: number;
  }): Promise<ProcessedImage> => {
    const response = await api.post<ProcessedImage>('/generation/create', data);
    return response.data;
  },

  createStylePreset: async (name: string, styleData: Record<string, any>): Promise<StylePreset> => {
    const response = await api.post<StylePreset>('/generation/style-presets', {
      name,
      style_data: styleData,
    });
    return response.data;
  },

  deleteStylePreset: async (presetId: number): Promise<void> => {
    await api.delete(`/generation/style-presets/${presetId}`);
  },
};
