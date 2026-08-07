import { NextResponse } from 'next/server';

export const runtime = 'edge'; // Run on edge for quick response

export async function GET() {
  // Read key dynamically from runtime environment (e.g. Cloudflare Worker vars)
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
  
  return NextResponse.json({
    publicKey,
  });
}
