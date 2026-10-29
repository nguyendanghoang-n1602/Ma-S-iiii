import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Khởi tạo và quản lý kết nối Supabase
const STORAGE_URL_KEY = 'langsoi_supabase_url';
const STORAGE_ANON_KEY = 'langsoi_supabase_anon_key';
const SESSION_ID_KEY = 'langsoi_user_session_id';
const PLAYER_NAME_KEY = 'langsoi_player_name';

export function getOrCreateSessionId(): string {
  let id = localStorage.getItem(SESSION_ID_KEY);
  if (!id) {
    id = 'user_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
    localStorage.setItem(SESSION_ID_KEY, id);
  }
  return id;
}

export function getSavedPlayerName(): string {
  return localStorage.getItem(PLAYER_NAME_KEY) || '';
}

export function savePlayerName(name: string): void {
  localStorage.setItem(PLAYER_NAME_KEY, name.trim());
}

export function getSupabaseCredentials(): { url: string; key: string } {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  const localUrl = localStorage.getItem(STORAGE_URL_KEY) || '';
  const localKey = localStorage.getItem(STORAGE_ANON_KEY) || '';

  return {
    url: localUrl || envUrl,
    key: localKey || envKey,
  };
}

export function saveSupabaseCredentials(url: string, key: string) {
  localStorage.setItem(STORAGE_URL_KEY, url.trim());
  localStorage.setItem(STORAGE_ANON_KEY, key.trim());
  // Reset cached client
  cachedClient = null;
}

let cachedClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (cachedClient) return cachedClient;

  const { url, key } = getSupabaseCredentials();
  if (!url || !key) {
    return null;
  }

  try {
    cachedClient = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
    return cachedClient;
  } catch (err) {
    console.error('Lỗi khởi tạo Supabase Client:', err);
    return null;
  }
}

export function isSupabaseConfigured(): boolean {
  const { url, key } = getSupabaseCredentials();
  return Boolean(url && key && url.startsWith('http'));
}

export async function testSupabaseConnection(url?: string, key?: string): Promise<{ success: boolean; message: string }> {
  const testUrl = url || getSupabaseCredentials().url;
  const testKey = key || getSupabaseCredentials().key;

  if (!testUrl || !testKey) {
    return { success: false, message: 'Chưa điền Supabase URL hoặc Anon Key.' };
  }

  try {
    const client = createClient(testUrl, testKey);
    const { error } = await client.from('rooms').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      // If table doesn't exist yet
      if (error.message.includes('relation "public.rooms" does not exist')) {
        return {
          success: false,
          message: 'Kết nối thành công nhưng bảng "rooms" chưa được tạo! Hãy dán mã SQL Schema vào Supabase SQL Editor.',
        };
      }
      return { success: false, message: `Lỗi kết nối: ${error.message}` };
    }
    return { success: true, message: 'Kết nối Supabase và cơ sở dữ liệu Làng Sói thành công!' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Lỗi kiểm tra kết nối: ${msg}` };
  }
}
