import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://lcmdkuzvixgevkcdmbyg.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxjbWRrdXp2aXhnZXZrY2RtYnlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNDIyMzgsImV4cCI6MjA3MjcxODIzOH0.r6-ZiUSkqXnLgt_BmSMSjqgyoc91TU3IpUr5kKmVZS8';

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
