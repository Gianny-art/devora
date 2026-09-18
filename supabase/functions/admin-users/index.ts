import { createClient } from 'npm:@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Keep in sync with src/lib/admin.ts ADMIN_EMAILS
const ADMIN_EMAILS = ['giannyfoapa@gmail.com', 'forlannoums@gmail.com'];

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
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user?.email) throw new Error('Authentication required');
    if (!ADMIN_EMAILS.includes(userData.user.email.toLowerCase())) {
      return new Response(JSON.stringify({ success: false, error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => ({ action: 'list' }));
    const action = body.action || 'list';

    if (action === 'update') {
      const { userId, plan, plan_expires_at } = body;
      if (!userId || !plan) throw new Error('userId and plan required');
      const { error } = await supabase.from('profiles').update({
        plan,
        plan_expires_at: plan === 'free' ? null : (plan_expires_at ?? null),
      }).eq('id', userId);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Default: list all users with usage stats
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, full_name, company, plan, plan_expires_at, created_at')
      .order('created_at', { ascending: false });
    if (profilesError) throw profilesError;

    const [{ data: scans }, { data: leads }, { data: payments }] = await Promise.all([
      supabase.from('scans').select('user_id'),
      supabase.from('leads').select('user_id'),
      supabase.from('payments').select('user_id, status, amount_xaf, provider, created_at').eq('status', 'success'),
    ]);

    const scanCounts = new Map<string, number>();
    for (const s of scans || []) scanCounts.set(s.user_id, (scanCounts.get(s.user_id) || 0) + 1);
    const leadCounts = new Map<string, number>();
    for (const l of leads || []) leadCounts.set(l.user_id, (leadCounts.get(l.user_id) || 0) + 1);
    const paymentTotals = new Map<string, number>();
    for (const p of payments || []) paymentTotals.set(p.user_id, (paymentTotals.get(p.user_id) || 0) + (p.amount_xaf || 0));

    const users = (profiles || []).map(p => ({
      ...p,
      scanCount: scanCounts.get(p.id) || 0,
      leadCount: leadCounts.get(p.id) || 0,
      totalPaidXaf: paymentTotals.get(p.id) || 0,
    }));

    return new Response(JSON.stringify({
      success: true,
      users,
      totals: {
        userCount: users.length,
        premiumCount: users.filter(u => u.plan === 'premium').length,
        totalScans: scans?.length || 0,
        totalLeads: leads?.length || 0,
        totalRevenueXaf: (payments || []).reduce((sum, p) => sum + (p.amount_xaf || 0), 0),
      },
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

