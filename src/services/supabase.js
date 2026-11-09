import { createClient } from '@supabase/supabase-js';

const getEnv = (key) => {
  const val = import.meta.env[key];
  return typeof val === 'string' ? val.trim().replace(/^["']|["']$/g, '') : '';
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

const validUrl = supabaseUrl.startsWith('http') ? supabaseUrl : 'https://placeholder.supabase.co';
const validKey = supabaseAnonKey || 'placeholder-key';

export const supabase = createClient(validUrl, validKey);
