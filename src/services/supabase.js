import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wlmserqtpolxecmznzsa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsbXNlcnF0cG9peGVjbXpuenNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5NDE5ODU1OSwiZXhwIjoyMTA5Nzc0NTU5fQ.Lvzjg0ahouNHnV1Wd9aXrqUac2aOOIbsLXRfaZl4PDM';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
