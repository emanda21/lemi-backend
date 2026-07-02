/**
 * lib/supabaseAdmin.js
 *
 * Server-only Supabase client using the service_role (secret) key.
 * Import this ONLY in Next.js API route handlers (app/api/**).
 * NEVER import it in client components — it exposes the service key.
 *
 * Required env vars in .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL   — your project URL: https://<ref>.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY  — the sb_secret_*** key from Project Settings → API
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;

// ── Validate configuration at module load time ─────────────────────────────
if (!supabaseUrl) {
  console.error(
    '[supabaseAdmin] ❌ NEXT_PUBLIC_SUPABASE_URL is not set.\n' +
    '   Go to: Supabase Dashboard → Project Settings → API\n' +
    '   Copy the "Project URL" value (starts with https://) and set it in .env.local'
  );
} else if (!supabaseUrl.startsWith('https://')) {
  console.error(
    '[supabaseAdmin] ❌ NEXT_PUBLIC_SUPABASE_URL looks wrong!\n' +
    '   Current value: ' + supabaseUrl + '\n' +
    '   Expected format: https://<your-project-ref>.supabase.co\n' +
    '   It seems you may have pasted an API key instead of the URL.\n' +
    '   Go to: Supabase Dashboard → Project Settings → API → "Project URL"'
  );
}

if (!serviceKey) {
  console.error(
    '[supabaseAdmin] ❌ SUPABASE_SERVICE_ROLE_KEY is not set.\n' +
    '   Go to: Supabase Dashboard → Project Settings → API\n' +
    '   Copy the "service_role" key (sb_secret_*** or the long eyJ*** JWT)'
  );
}

/**
 * Supabase admin client — bypasses Row Level Security via service_role key.
 * Module-level singleton: created once, reused across all requests.
 */
const supabaseAdmin = createClient(
  supabaseUrl  ?? 'https://placeholder.supabase.co',
  serviceKey   ?? 'placeholder-key',
  {
    auth: {
      // Disable Supabase's built-in session management.
      // We handle our own token signing (HMAC-SHA256) in the auth routes.
      autoRefreshToken:    false,
      persistSession:      false,
      detectSessionInUrl:  false,
    },
  }
);

export default supabaseAdmin;
