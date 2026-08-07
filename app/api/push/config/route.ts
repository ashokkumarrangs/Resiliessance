import { NextResponse } from 'next/server';

export const runtime = 'nodejs'; // Use standard nodejs runtime matching the other working endpoints

export async function GET() {
  try {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
    return NextResponse.json({
      publicKey,
    });
  } catch (error: any) {
    console.error('Error in config API:', error);
    return NextResponse.json({
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}
