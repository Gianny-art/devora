import { createClient } from 'npm:@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PLAN_DURATION_DAYS = 30;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Authentication required');
    const { data: userData, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !userData.user) throw new Error('Authentication required');

    const { reference } = await req.json();
    if (!reference || typeof reference !== 'string') throw new Error('Missing reference');

    const { data: payment } = await supabase
      .from('payments')
      .select('status, provider, provider_reference, tier, user_id')
      .eq('external_reference', reference)
      .eq('user_id', userData.user.id)
      .single();

    if (!payment) throw new Error('Payment not found');

    // Already resolved (by the webhook, or a previous poll) — nothing to check.
    if (payment.status !== 'pending') {
      return new Response(JSON.stringify({ status: payment.status }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fallback: actively ask CamPay for the transaction status, in case the
    // merchant's webhook isn't configured (a very common setup gap) or the
    // notification simply hasn't arrived yet.
    if (payment.provider === 'campay' && payment.provider_reference) {
      const liveStatus = await checkCamPayStatus(payment.provider_reference);
      if (liveStatus === 'SUCCESSFUL') {
        const expiresAt = new Date(Date.now() + PLAN_DURATION_DAYS * 24 * 60 * 60 * 1000).toISOString();
        await supabase.from('payments').update({ status: 'success', confirmed_at: new Date().toISOString() }).eq('external_reference', reference);
        await supabase.from('profiles').update({ plan: payment.tier, plan_expires_at: expiresAt }).eq('id', payment.user_id);
        return new Response(JSON.stringify({ status: 'success' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (liveStatus === 'FAILED') {
        await supabase.from('payments').update({ status: 'failed' }).eq('external_reference', reference);
        return new Response(JSON.stringify({ status: 'failed' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    return new Response(JSON.stringify({ status: 'pending' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function checkCamPayStatus(providerReference: string): Promise<string | null> {
  const baseUrl = Deno.env.get('CAMPAY_BASE_URL') || 'https://demo.campay.net';
  const username = Deno.env.get('CAMPAY_USERNAME');
  const password = Deno.env.get('CAMPAY_PASSWORD');
  if (!username || !password) return null;

  try {
    const tokenRes = await fetch(`${baseUrl}/api/token/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!tokenRes.ok) return null;
    const { token } = await tokenRes.json();

    const statusRes = await fetch(`${baseUrl}/api/transaction/${providerReference}/`, {
      headers: { Authorization: `Token ${token}` },
    });
    if (!statusRes.ok) return null;
    const body = await statusRes.json();
    return body?.status ?? null;
  } catch {
    return null;
  }
}
