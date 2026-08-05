// ============================================================
// Type Definitions for Property Listing System
// ============================================================

export interface Listing {
  id: string;
  kawasan: string | null;
  alamat: string | null;
  lt: number | null;
  lb: number | null;
  kt: number | null;
  km: number | null;
  hadap: string | null;
  lantai: number | null;
  sertifikat: string | null;
  furnished: string | null;
  harga: number | null;
  harga_text: string | null;
  keterangan: string | null;
  photo_link?: string | null;
  kondisi: string | null;
  jenis_properti: string | null;
  ketersediaan: string | null;
  tipe_transaksi: string | null;
  agent_name: string;
  status: 'active' | 'sold' | 'inactive';
  source: 'web' | 'telegram';
  telegram_user_id: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ListingFormData {
  kawasan: string;
  alamat: string;
  lt: number | '';
  lb: number | '';
  kt: number | '';
  km: number | '';
  hadap: string;
  lantai: number | '';
  sertifikat: string;
  furnished: string;
  harga: number | '';
  harga_text: string;
  keterangan: string;
  photo_link: string;
  kondisi: string;
  jenis_properti: string;
  ketersediaan: string;
  tipe_transaksi: string;
  agent_name: string;
  status: 'active' | 'sold' | 'inactive';
}

export interface ListingSearchParams {
  kawasan?: string;
  harga_min?: number;
  harga_max?: number;
  kt_min?: number;
  km_min?: number;
  hadap?: string;
  lt_min?: number;
  lb_min?: number;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface AllowedUser {
  id: string;
  email: string;
  role: 'admin' | 'agent';
  created_at: string;
}

export interface AllowedTelegramUser {
  id: string;
  telegram_user_id: string;
  name: string | null;
  created_at: string;
}

// ============================================================
// Telegram Bot Types
// ============================================================

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
}

export interface TelegramMessage {
  message_id: number;
  from: TelegramUser;
  chat: TelegramChat;
  text?: string;
  date: number;
}

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
}

export interface TelegramChat {
  id: number;
  type: string;
}

export interface TelegramCallbackQuery {
  id: string;
  from: TelegramUser;
  message?: TelegramMessage;
  data?: string;
}

// ============================================================
// AI Types (Groq / LLM)
// ============================================================

export interface ParsedListing {
  kawasan: string;
  alamat: string;
  lt: number | null;
  lb: number | null;
  kt: number | null;
  km: number | null;
  hadap: string;
  lantai: number | null;
  sertifikat: string;
  furnished: string;
  harga: number | null;
  harga_text: string;
  keterangan: string;
  photo_link?: string | null;
  kondisi: string | null;
  jenis_properti: string | null;
  ketersediaan: string | null;
  tipe_transaksi: string | null;
  agent_name: string;
}

export interface SearchParams {
  kawasan: string | null;
  harga_min: number | null;
  harga_max: number | null;
  kt_min: number | null;
  km_min: number | null;
  hadap?: string | null;
  lt_min?: number | null;
  lb_min?: number | null;
  keyword: string | null;
}

export type BotIntent = 'search' | 'template_parse' | 'confirm_save' | 'cancel_save' | 'help' | 'start' | 'chat';
