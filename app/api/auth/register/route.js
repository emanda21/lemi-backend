/**
 * app/api/auth/register/route.js
 *
 * POST /api/auth/register
 * Body: { name: string, password: string }
 *
 * Registers a new user in Supabase (public.users table).
 * Password is hashed with Node crypto.scryptSync before storage.
 * No email or phone required — Full Name + Password only.
 *
 * Returns:
 *   201  { success: true,  message: string }
 *   400  { success: false, message: string }  — validation / duplicate name
 *   500  { success: false, message: string }  — unexpected / DB error
 */

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import supabaseAdmin from '@/lib/supabaseAdmin';

// ─── Password helpers ─────────────────────────────────────────────────────────

/** Hash a plaintext password. Returns { hash, salt } as hex strings. */
function hashPassword(plaintext) {
  const salt = crypto.randomBytes(16).toString('hex');           // 32-char hex
  const hash = crypto.scryptSync(plaintext, salt, 64).toString('hex'); // 128-char hex
  return { hash, salt };
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
  if (password.length < 6) {
    return NextResponse.json(
      { success: false, message: 'የይለፍ ቃሉ ቢያንስ 6 ቁጥሮች መሆን አለበት። / Jecha darbiin qubee 6 ol qabaachuu qaba.' },
      { status: 400 }
    );
  }

  const fullName = name.trim();

  try {
    // ── Hash the password ─────────────────────────────────────────────────────
    const { hash, salt } = hashPassword(password);

    // ── Insert into Supabase ──────────────────────────────────────────────────
    const { error } = await supabaseAdmin
      .from('users')
      .insert({
        full_name:     fullName,
        password_hash: hash,
        password_salt: salt,
      });

    if (error) {
      // PostgreSQL unique-violation → duplicate full_name
      if (error.code === '23505') {
        console.warn(`[/api/auth/register] Duplicate name attempt: "${fullName}"`);
        return NextResponse.json(
          {
            success: false,
            message: 'ይህ ስም ቀድሞ ተምዝግቧል። ሌላ ስም ይምረጡ። / Maqaan kun duraan galmeeffameera. Maqaa biraa filadhu.',
          },
          { status: 400 }
        );
      }

      // Any other Supabase / DB error
      console.error('[/api/auth/register] Supabase insert error:', error);
      return NextResponse.json(
        { success: false, message: `Database error: ${error.message}` },
        { status: 500 }
      );
    }

    console.log(`[/api/auth/register] ✅ Registered: "${fullName}"`);

    return NextResponse.json(
      {
        success: true,
        message: 'ምዝገባ ተሳክቷል! አሁን ይግቡ። / Galmeessuun milkaa\'e! Amma seenaa.',
      },
      { status: 201 }
    );

  } catch (err) {
    console.error('[/api/auth/register] Unexpected error:', err);
    return NextResponse.json(
      { success: false, message: 'An unexpected server error occurred.' },
      { status: 500 }
    );
  }
}
