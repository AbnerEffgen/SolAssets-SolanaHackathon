import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error("Supabase environment variables are not configured.");
}

type SupabaseTypedClient = SupabaseClient<Database>;

const createSupabaseClient = (): SupabaseTypedClient =>
  createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

let cachedClient: SupabaseTypedClient | null = null;

export const getSupabaseClient = (): SupabaseTypedClient => {
  if (!cachedClient) {
    cachedClient = createSupabaseClient();
  }
  return cachedClient;
};

export const restartSupabaseClient = (): SupabaseTypedClient => {
  cachedClient = createSupabaseClient();
  return cachedClient;
};

export const supabase = getSupabaseClient();
