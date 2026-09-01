import "react-native-url-polyfill/auto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.generated";
import { LargeSecureStore } from "@/lib/secure-store";
import { supabaseAnonKey, supabaseUrl } from "@/lib/supabase/env";

let client: SupabaseClient<Database> | null = null;
let publicClient: SupabaseClient<Database> | null = null;

export function createSupabaseClient() {
  const url = supabaseUrl();
  const key = supabaseAnonKey();
  if (!url || !key) return null;
  if (client) return client;
  client = createClient<Database>(url, key, {
    auth: {
      storage: LargeSecureStore,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
  return client;
}

export function requireClient() {
  const supabase = createSupabaseClient();
  if (!supabase) {
    throw new Error("Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.");
  }
  return supabase;
}

/** Anon directory reads. No session so listings are not tied to a login. */
export function createPublicClient() {
  const url = supabaseUrl();
  const key = supabaseAnonKey();
  if (!url || !key) return null;
  if (publicClient) return publicClient;
  publicClient = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return publicClient;
}

export function requirePublicClient() {
  const supabase = createPublicClient();
  if (!supabase) {
    throw new Error("Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.");
  }
  return supabase;
}
