export function supabaseUrl() {
  return process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() || "";
}

export function supabaseAnonKey() {
  return process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() || "";
}
