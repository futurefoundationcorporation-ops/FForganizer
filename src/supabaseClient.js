import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const ACCESS_KEY = 'ACCESS-97e1328c838a12b45813608dced103963cfd285f7d54eb3c47370eb36b8a234c';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    headers: {
      'x-api-key': ACCESS_KEY,
    },
  },
});
