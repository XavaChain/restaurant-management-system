import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || 'https://wlmserqtpolxecmznzsa.supabase.co').trim();
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_TXsD5Lzl2zht_PA1IDmUzQ_Dmqs-NG7').trim();

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
