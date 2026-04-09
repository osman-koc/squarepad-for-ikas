import { NextResponse } from 'next/server';

/**
 * Lightweight health check endpoint used by Docker HEALTHCHECK and uptime monitors.
 * Returns 200 OK when the Next.js server is up and accepting requests.
 * No auth, no DB call — intentionally minimal so it never fails spuriously.
 */
export async function GET() {
  return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() });
}
