import { createClient } from '@supabase/supabase-js';

// Netlify build fallback variables to fix "Failed to fetch"
const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL.startsWith('http'))
  ? import.meta.env.VITE_SUPABASE_URL.trim()
  : 'https://wlmserqtpolxecmznzsa.supabase.co';

const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY && import.meta.env.VITE_SUPABASE_ANON_KEY.length > 10)
  ? import.meta.env.VITE_SUPABASE_ANON_KEY.trim()
  : 'sb_publishable_TXsD5Lzl2zht_PA1IDmUzQ_Dmqs-NG7';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
