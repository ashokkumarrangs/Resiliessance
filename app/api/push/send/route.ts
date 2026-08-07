import { NextResponse } from 'next/server';
import { buildPushPayload, type PushSubscription, type PushMessage, type VapidKeys } from '@block65/webcrypto-web-push';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs'; // OpenNext standard nodejs environment supporting ESM

const cleanKey = (key: string) => {
  if (!key) return '';
  // Strip any accidental quotes or whitespace characters
  return key.replace(/['"\s]/g, '').trim();
};

// Send a push notification using fetch & Web Crypto (Edge-compatible)
async function sendPushNotification(
  subscription: any,
  payloadData: { title: string; body: string; url: string; tag: string }
) {
  const rawPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const rawPrivateKey = process.env.VAPID_PRIVATE_KEY;

  if (!rawPublicKey || !rawPrivateKey) {
    throw new Error('VAPID keys are missing from environment variables.');
  }

  const publicKey = cleanKey(rawPublicKey);
  const privateKey = cleanKey(rawPrivateKey);

  const vapid: VapidKeys = {
    subject: 'mailto:admin@resiliessance.com',
    publicKey,
    privateKey,
  };

  const p256dh = subscription.keys?.p256dh || subscription.p256dh;
  const auth = subscription.keys?.auth || subscription.auth;

  if (!p256dh || !auth) {
    throw new Error('Subscription keys p256dh and auth are required.');
  }

  const pushSubscription: PushSubscription = {
    endpoint: subscription.endpoint,
    expirationTime: null,
    keys: {
      p256dh,
      auth,
    },
  };

  const message: PushMessage = {
    data: JSON.stringify(payloadData),
    options: {
      ttl: 86400, // Time to live: 1 day
    },
  };

  // Build payload (handles JWT signing and body encryption using standard Web Crypto)
  const payload = await buildPushPayload(message, pushSubscription, vapid);

  // Send request using standard fetch API
  const response = await fetch(subscription.endpoint, {
    method: 'POST',
    headers: payload.headers as HeadersInit,
    body: payload.body as any,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Push service returned status ${response.status}: ${text}`);
  }

  return response.status;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { subscription, title, messageBody, url, tag } = body;

    const payloadData = {
      title: title || 'Resiliessance Notification',
      body: messageBody || 'This is a test notification!',
      url: url || '/',
      tag: tag || 'test-tag',
    };

    // Case 1: Send to a specific subscription passed in the request (useful for testing on current device)
    if (subscription && subscription.endpoint) {
      try {
        await sendPushNotification(subscription, payloadData);
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
        try {
          await sendPushNotification(dbSub, payloadData);
          return { endpoint: dbSub.endpoint, status: 'success' };
        } catch (err: any) {
          console.error(`Error sending notification to endpoint ${dbSub.endpoint}:`, err);
          
          // If the subscription is expired or unregistered, remove it from our database
          if (err.message.includes('410') || err.message.includes('404')) {
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
