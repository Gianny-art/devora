import { createClient } from 'npm:@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ subscribed: false, plan: 'free' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ subscribed: false, plan: 'free' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('plan, plan_expires_at, role')
      .eq('id', userData.user.id)
      .single();

    let plan = profile?.plan || 'free';
    const expiresAt = profile?.plan_expires_at ? new Date(profile.plan_expires_at) : null;

    if (plan !== 'free' && expiresAt && expiresAt.getTime() < Date.now()) {
      // Subscription lapsed — downgrade.
      plan = 'free';
      await supabaseClient.from('profiles').update({ plan: 'free', plan_expires_at: null }).eq('id', userData.user.id);
    }

    return new Response(JSON.stringify({
      subscribed: plan !== 'free',
      plan,
      plan_expires_at: plan !== 'free' ? profile?.plan_expires_at ?? null : null,
      role: profile?.role || 'user',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
