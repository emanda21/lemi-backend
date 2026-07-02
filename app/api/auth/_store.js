/**
 * app/api/auth/_store.js  —  DEPRECATED / REMOVED
 *
 * This file previously held the in-memory Map used for auth in development.
 * It has been replaced by Supabase (PostgreSQL) persistent storage.
 *
 * Auth is now handled by:
 *   app/api/auth/register/route.js  → inserts into Supabase public.users
 *   app/api/auth/login/route.js     → queries Supabase, verifies hash, issues token
 *   app/api/auth/verify/route.js    → verifies token + live Supabase user check
 *   lib/supabaseAdmin.js            → shared server-only Supabase client
 *
 * DO NOT import this file. It exports nothing.
 */
