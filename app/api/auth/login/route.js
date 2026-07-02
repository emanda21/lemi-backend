/**
 * app/api/auth/login/route.js
 *
 * POST /api/auth/login
 * Body: { name: string, password: string }
 *
 * Queries Supabase for the user by full_name (case-insensitive),
 * verifies the scrypt password hash, and issues a signed HMAC-SHA256 token.
 *
 * Token format (3-part, dot-separated, base64url encoded):
 *   <header>.<payload>.<HMAC-SHA256 signature>
 *   payload = { name, iat }
 *
 * Returns:
 *   200  { success: true,  token: string, name: string, message: string }
 *   400  { success: false, message: string }  — missing / invalid fields
 *   401  { success: false, message: string }  — wrong name or password
 *   500  { success: false, message: string }  — unexpected / DB error
 */

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import supabaseAdmin from '@/lib/supabaseAdmin';

// ─── JWT Secret ───────────────────────────────────────────────────────────────
// Must be set in .env.local. Falls back to a stable per-process random value
// (tokens invalidated on server restart — fine for dev, bad for production).
const JWT_SECRET =
  process.env.LEMI_JWT_SECRET ??
  (() => {
    if (!globalThis.__lemiJwtSecret) {
      globalThis.__lemiJwtSecret = crypto.randomBytes(32).toString('hex');
      console.warn(
        '[auth/login] ⚠️  LEMI_JWT_SECRET not set — tokens invalidated on restart.'
      );
    }
    return globalThis.__lemiJwtSecret;
  })();

// ─── Crypto helpers ───────────────────────────────────────────────────────────

/** Constant-time comparison to prevent timing attacks. */
function safeEqual(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/** Verify a plaintext password against the stored scrypt hash + salt. */
function verifyPassword(plaintext, storedHash, storedSalt) {
  try {
    const derived = crypto.scryptSync(plaintext, storedSalt, 64).toString('hex');
    return safeEqual(derived, storedHash);
  } catch {
    return false;
  }
}

/** Issue a signed HMAC-SHA256 token for the given full name. */
function issueToken(fullName) {
  const header  = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ name: fullName, iat: Math.floor(Date.now() / 1000) })).toString('base64url');
  const sig = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url');
  return `${header}.${payload}.${sig}`;
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request) {
  // ── Parse body ──────────────────────────────────────────────────────────────
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: 'Invalid request body — expected JSON.' },
      { status: 400 }
    );
  }

  const { name, password } = body ?? {};

  // ── Input validation ────────────────────────────────────────────────────────
  if (!name || typeof name !== 'string' || !name.trim()) {
    return NextResponse.json(
      { success: false, message: 'ሙሉ ስም ያስፈልጋል። / Maqaa guutuu barbaachisaadha.' },
      { status: 400 }
    );
  }
  if (!password || typeof password !== 'string') {
    return NextResponse.json(
      { success: false, message: 'የይለፍ ቃል ያስፈልጋል። / Jecha darbii barbaachisaadha.' },
      { status: 400 }
    );
  }

  const fullName = name.trim();

  try {
    // ── Query Supabase for the user (case-insensitive match) ──────────────────
    const { data: users, error: queryError } = await supabaseAdmin
      .from('users')
      .select('full_name, password_hash, password_salt')
      .filter('full_name', 'ilike', fullName)  // ilike = case-insensitive LIKE
      .limit(1);

    if (queryError) {
      console.error('[/api/auth/login] Supabase query error:', queryError);
      return NextResponse.json(
        { success: false, message: `Database error: ${queryError.message}` },
        { status: 500 }
      );
    }

    const user = users?.[0] ?? null;

    // ── User not found ─────────────────────────────────────────────────────────
    // Return the same message as wrong-password to prevent username enumeration.
    if (!user) {
      console.warn(`[/api/auth/login] ❌ Not found: "${fullName}"`);
      return NextResponse.json(
        {
          success: false,
          message: 'ስም ወይም የይለፍ ቃሉ ትክክል አይደለም። / Maqaa ykn jecha darbii dogoggore.',
        },
        { status: 401 }
      );
    }

    // ── Password verification ─────────────────────────────────────────────────
    const passwordOk = verifyPassword(password, user.password_hash, user.password_salt);
    if (!passwordOk) {
      console.warn(`[/api/auth/login] ❌ Wrong password for: "${fullName}"`);
      return NextResponse.json(
        {
          success: false,
          message: 'ስም ወይም የይለፍ ቃሉ ትክክል አይደለም። / Maqaa ykn jecha darbii dogoggore.',
        },
        { status: 401 }
      );
    }

    // ── Issue token & respond ─────────────────────────────────────────────────
    const token = issueToken(user.full_name);
    console.log(`[/api/auth/login] ✅ Login: "${user.full_name}"`);

    return NextResponse.json(
      {
        success: true,
        token,
        name: user.full_name,
        message: 'ወደ ሲስተሙ በደህና ገቡ! / Sisteematti baga nagaan seentan!',
      },
      { status: 200 }
    );

  } catch (err) {
    console.error('[/api/auth/login] Unexpected error:', err);
    return NextResponse.json(
      { success: false, message: 'An unexpected server error occurred.' },
      { status: 500 }
    );
  }
}
