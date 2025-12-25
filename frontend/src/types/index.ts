export interface User {
  id: number;
  telegram_id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  images_remaining: number;
  total_images_processed: number;
  created_at: string;
  referral_code?: string;
  total_referrals: number;
}

export interface Package {
  id: number;
  name: string;
  photoshoots_count: number;
  price_rub: number;
  is_active: boolean;
}

export interface Order {
  id: number;
  user_id: number;
  package_id: number;
  amount: number;
  status: string;
  created_at: string;
  paid_at?: string;
}

export interface ProcessedImage {
  id: number;
  user_id: number;
  style_name?: string;
  prompt_used?: string;
  aspect_ratio?: string;
  is_free: boolean;
  created_at: string;
  processed_file_id?: string;
}

export interface StylePreset {
  id: number;
  user_id: number;
  name: string;
  style_data: Record<string, any>;
  created_at: string;
  is_active: boolean;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface GenerationStatus {
  status: 'uploading' | 'analyzing' | 'generating_prompt' | 'generating_images' | 'completed' | 'failed';
  progress: number;
  message: string;
  images?: string[];
  image_id?: number;
}

export enum AuthMethod {
  WIDGET = 'widget',
  CODE = 'code'
}
