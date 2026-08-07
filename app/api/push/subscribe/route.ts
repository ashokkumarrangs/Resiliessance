import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Explicitly use nodejs runtime since we might use other Node libs if needed
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { subscription, deviceName } = body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json({ error: 'Invalid subscription object' }, { status: 400 });
    }

    const { endpoint, keys } = subscription;
    const { p256dh, auth } = keys;

    if (!p256dh || !auth) {
      return NextResponse.json({ error: 'Keys p256dh and auth are required' }, { status: 400 });
    }

    // Insert or update subscription in Supabase
    // If endpoint already exists, we update the keys and device_name
    const { data, error } = await supabase
      .from('push_subscriptions')
      .upsert(
        {
          endpoint,
          p256dh,
          auth,
          device_name: deviceName || 'Unknown Device',
        },
        { onConflict: 'endpoint' }
      )
      .select();

    if (error) {
      console.error('Error saving subscription to Supabase:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Subscribe POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');

    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint parameter is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('endpoint', endpoint);

    if (error) {
      console.error('Error deleting subscription from Supabase:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Subscribe DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
