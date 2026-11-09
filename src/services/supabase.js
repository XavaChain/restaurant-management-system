import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wlmserqtpolxecmznzsa.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_TXsD5Lzl2zht_PA1IDmUzQ_Dmqs-NG7
';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
