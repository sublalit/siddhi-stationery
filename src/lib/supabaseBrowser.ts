import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qirasryjssqlfnhkpwmc.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpcmFzcnlqc3NxbGZuaGtwd21jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIzNjY0MDAsImV4cCI6MjA1Nzk0MjQwMH0.placeholder';

export function createSupabaseBrowserClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
