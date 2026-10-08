import { createBrowserClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
export function configured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}
export function browserClient() {
  if (!configured())
    throw new Error(
      "Talix is temporarily unavailable. Please try again shortly.",
    );
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}

// An immediate-session signup needs no PKCE exchange. The ordinary SSR client
// installs its returned session; this transient client never stores credentials.
export function immediateSignupClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: {
        flowType: "implicit",
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
        storageKey: "talix-immediate-signup",
      },
    },
  );
}
