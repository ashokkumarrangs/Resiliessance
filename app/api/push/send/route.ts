import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';

const cleanKey = (key: string) => {
  if (!key) return '';
  // Strip any accidental quotes or whitespace characters
  return key.replace(/['"\s]/g, '').trim();
};

const normalizePrivateKey = (privateKeyB64: string): string => {
  const cleaned = cleanKey(privateKeyB64);
  if (!cleaned) return '';

  try {
    // Convert base64url to standard base64 for Buffer
    const base64 = cleaned.replace(/-/g, '+').replace(/_/g, '/');
    const buffer = Buffer.from(base64, 'base64');

    if (buffer.length === 32) {
      return cleaned;
    }

    if (buffer.length < 32) {
      // Pad with leading zeros to make it exactly 32 bytes
      const padded = Buffer.alloc(32);
      buffer.copy(padded, 32 - buffer.length);
      
      // Convert back to base64url
      return padded.toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    }
  } catch (e) {
    console.error('Error normalizing private key:', e);
  }

  return cleaned;
};

// Initialize web-push with VAPID details
const initWebPush = () => {
  const rawPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const rawPrivateKey = process.env.VAPID_PRIVATE_KEY;

  if (!rawPublicKey || !rawPrivateKey) {
    console.warn('VAPID keys are missing from environment variables.');
    return false;
  }

  const publicKey = cleanKey(rawPublicKey);
  const privateKey = normalizePrivateKey(rawPrivateKey);

  try {
    webpush.setVapidDetails(
      'mailto:admin@resiliessance.com', // Must be a mailto: or website URL
      publicKey,
      privateKey
    );
    return true;
  } catch (err: any) {
    console.error('Error in setVapidDetails:', err);
    throw new Error(`VAPID Init Failed: ${err.message} (Public Key Length: ${publicKey.length}, Private Key Length: ${privateKey.length})`);
  }
};

export async function POST(request: Request) {
  try {
    const isConfigured = initWebPush();
    if (!isConfigured) {
      return NextResponse.json(
        { error: 'VAPID keys are not configured. Go to settings or check your environment variables.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { subscription, title, messageBody, url, tag } = body;

    const payload = JSON.stringify({
      title: title || 'Resiliessance Notification',
      body: messageBody || 'This is a test notification!',
      url: url || '/',
      tag: tag || 'test-tag',
    });

    // Case 1: Send to a specific subscription passed in the request (useful for testing on current device)
    if (subscription && subscription.endpoint) {
      try {
        const formattedSub = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.keys?.p256dh || subscription.p256dh,
            auth: subscription.keys?.auth || subscription.auth,
          },
        };
        await webpush.sendNotification(formattedSub, payload);
        return NextResponse.json({ success: true, message: 'Notification sent successfully.' });
      } catch (err: any) {
        console.error('Error sending single push notification:', err);
        return NextResponse.json({ error: `Failed to send: ${err.message}` }, { status: 500 });
      }
    }

    // Case 2: Send to all subscriptions stored in Supabase database
    const { data: dbSubscriptions, error: dbError } = await supabase
      .from('push_subscriptions')
      .select('*');

    if (dbError) {
      console.error('Error fetching subscriptions from database:', dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    if (!dbSubscriptions || dbSubscriptions.length === 0) {
      return NextResponse.json({ success: true, message: 'No subscriptions found in database to notify.' });
    }

    const results = await Promise.all(
      dbSubscriptions.map(async (dbSub) => {
        const formattedSub = {
          endpoint: dbSub.endpoint,
          keys: {
            p256dh: dbSub.p256dh,
            auth: dbSub.auth,
          },
        };

        try {
          await webpush.sendNotification(formattedSub, payload);
          return { endpoint: dbSub.endpoint, status: 'success' };
        } catch (err: any) {
          console.error(`Error sending notification to endpoint ${dbSub.endpoint}:`, err);
          
          // If the subscription is expired or unregistered, remove it from our database
          if (err.statusCode === 410 || err.statusCode === 404) {
            console.log(`Removing expired subscription: ${dbSub.endpoint}`);
            await supabase
              .from('push_subscriptions')
              .delete()
              .eq('endpoint', dbSub.endpoint);
            return { endpoint: dbSub.endpoint, status: 'removed_expired' };
          }
          
          return { endpoint: dbSub.endpoint, status: 'failed', error: err.message };
        }
      })
    );

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error('Send API route error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
