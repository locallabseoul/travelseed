import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Creates the shared Supabase client used by server and client components in this MVP.
export function createSupabaseClient() {
  // Fallback values let `next build` run before local environment variables are configured.
  return createClient(
    supabaseUrl ?? "https://example.supabase.co",
    supabaseAnonKey ?? "missing-anon-key",
  );
}

export const supabase = createSupabaseClient();
