import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://trzaeinxlytyqxptkuyj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyemFlaW54bHl0eXF4cHRrdXlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM4OTU3OTcsImV4cCI6MjA0OTQ3MTc5N30.RSh50RC3Vc29U0Xrxn_qDQgeUtH2sEi8JhGIdo1F7jU";

export const supabase = createClient<Database>(
  SUPABASE_URL, 
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    },
    global: {
      headers: {
        'X-Client-Info': 'supabase-js-web'
      }
    },
    db: {
      schema: 'public'
    }
  }
);

// Add error handling helper
export const handleSupabaseError = (error: any) => {
  console.error('Supabase error:', error);
  
  if (error.message === 'Failed to fetch') {
    console.error('Network error - unable to connect to Supabase');
    return new Error('Unable to connect to the server. Please check your internet connection and try again.');
  }
  
  if (error.error_description) {
    return new Error(error.error_description);
  }
  
  if (error.msg) {
    return new Error(error.msg);
  }
  
  return error;
};