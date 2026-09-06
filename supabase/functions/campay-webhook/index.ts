import { createClient } from 'npm:@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PLAN_DURATION_DAYS = 30;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    // Baseline protection: CamPay's webhook URL should be configured with this secret
    // as a query param, e.g. https://.../campay-webhook?secret=xxxx
    const expectedSecret = Deno.env.get('CAMPAY_WEBHOOK_SECRET');
    if (expectedSecret) {
      const url = new URL(req.url);
      if (url.searchParams.get('secret') !== expectedSecret) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
      }
    }

    const payload = await req.json();
    const reference: string | undefined = payload.external_reference || payload.reference;
    const status: string | undefined = payload.status;
    if (!reference) throw new Error('Missing external_reference');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const isSuccess = status === 'SUCCESSFUL' || status === 'success';
    const { data: payment } = await supabase
      .from('payments')
      .update({ status: isSuccess ? 'success' : 'failed', confirmed_at: isSuccess ? new Date().toISOString() : null })
      .eq('external_reference', reference)
      .select('user_id, tier')
      .single();

    if (isSuccess && payment) {
      const expiresAt = new Date(Date.now() + PLAN_DURATION_DAYS * 24 * 60 * 60 * 1000).toISOString();
      await supabase.from('profiles').update({ plan: payment.tier, plan_expires_at: expiresAt }).eq('id', payment.user_id);
    }

    return new Response(JSON.stringify({ received: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
