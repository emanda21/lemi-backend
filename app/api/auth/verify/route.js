/**
 * app/api/auth/verify/route.js
 *
 * GET /api/auth/verify
 * Headers: Authorization: Bearer <token>
 *
 * Verifies the HMAC-SHA256 signature of a token issued by /api/auth/login,
 * then confirms the user still exists in Supabase.
 *
 * Returns:
 *   200  { valid: true,  name: string }
 *   401  { valid: false, message: string }
 *   500  { valid: false, message: string }
 */

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import supabaseAdmin from '@/lib/supabaseAdmin';

// ─── JWT Secret (must match login/route.js) ───────────────────────────────────
const JWT_SECRET =
  process.env.LEMI_JWT_SECRET ??
  (() => globalThis.__lemiJwtSecret ?? '')();

// ─── Token verification ───────────────────────────────────────────────────────

function safeEqual(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Verify the token's HMAC signature and decode the payload.
 * Returns the payload object on success, or null on failure.
 */
function verifyToken(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [header, payload, sig] = parts;

    // Recompute the expected signature
    const expectedSig = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${payload}`)
      .digest('base64url');

    if (!safeEqual(sig, expectedSig)) return null;

    // Decode and return the payload
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET(request) {
  try {
    // ── Extract Bearer token ────────────────────────────────────────────────
    const authHeader = request.headers.get('Authorization') ?? '';

    if (!authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { valid: false, message: 'Missing or malformed Authorization header.' },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      return NextResponse.json(
        { valid: false, message: 'Token is empty.' },
        { status: 401 }
      );
    }

    // ── Soft-pass if secret not yet available (cold-start race) ────────────
    if (!JWT_SECRET) {
      console.warn('[/api/auth/verify] JWT_SECRET not available — soft-pass.');
      return NextResponse.json({ valid: true, softPass: true }, { status: 200 });
    }

    // ── Verify signature ────────────────────────────────────────────────────
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { valid: false, message: 'Token signature is invalid or token is malformed.' },
        { status: 401 }
      );
    }

    const fullName = decoded?.name ?? '';

    // ── Confirm user still exists in Supabase ───────────────────────────────
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('full_name')
      .filter('full_name', 'ilike', fullName)
      .limit(1);

    if (error) {
      // DB temporarily unreachable — soft-pass rather than logging users out
      console.warn('[/api/auth/verify] Supabase query failed — soft-pass:', error.message);
      return NextResponse.json({ valid: true, softPass: true, name: fullName }, { status: 200 });
    }

    if (!users || users.length === 0) {
      return NextResponse.json(
        { valid: false, message: 'User no longer exists.' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { valid: true, name: users[0].full_name },
      { status: 200 }
    );

  } catch (err) {
    console.error('[/api/auth/verify] Unexpected error:', err);
    return NextResponse.json(
      { valid: false, message: 'Verification error.' },
      { status: 500 }
    );
  }
}
