import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Verifies if the request is authorized by the WhatsApp bot or external service.
 * Checks for either a 'Authorization: Bearer <key>' or 'x-api-key: <key>' header.
 */
export function isBotAuthorized(request: NextRequest): boolean {
  const botKey = process.env.BOT_API_KEY;

  // If no API key is set in environment, allow all requests for development ease, but log a warning.
  if (!botKey || botKey === 'your_bot_api_key_here') {
    console.warn('⚠️ BOT_API_KEY is not configured in .env.local. Allowing API request without token validation.');
    return true;
  }

  const authHeader = request.headers.get('Authorization') || request.headers.get('x-api-key');
  if (!authHeader) {
    return false;
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
  return token === botKey;
}

/**
 * Creates a Supabase client that uses the service_role key to bypass RLS.
 * This client should ONLY be used in secure API routes/server contexts.
 */
export function getBotSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // If service role key is not configured, fall back to anon key (respecting RLS)
  if (!serviceRoleKey || serviceRoleKey === 'your_supabase_service_role_key') {
    console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY not configured. Falling back to anon key client.');
    return createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
