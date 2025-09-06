import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper to get current user (v2 async, v1 sync)
export async function getCurrentUser() {
  if (supabase.auth.getUser) {
    // v2
    const { data } = await supabase.auth.getUser();
    return data.user;
  } else {
    // v1
    return supabase.auth.user();
  }
}
