import { createClient } from 'npm:@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Keep in sync with PLAN_FEATURES.amountXaf in src/types/index.ts
const TIER_AMOUNTS: Record<string, number> = {
  premium: 5000,
};

// CamPay rejects anything that isn't the full international MSISDN
// (237XXXXXXXXX) — a bare local number like "655260684" fails with
// "Invalid phone number" (ER101). Normalize whatever format the user typed.
function normalizeCameroonPhone(input: string): string | null {
  const digits = input.replace(/[^\d]/g, '').replace(/^00/, '');
  if (/^237\d{9}$/.test(digits)) return digits;
  if (/^\d{9}$/.test(digits)) return `237${digits}`;
  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Authentication required');
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) throw new Error('Authentication required');
    const user = userData.user;

    const { tier, provider, phone: rawPhone } = await req.json();
    if (!TIER_AMOUNTS[tier]) throw new Error('Invalid tier');
    if (provider !== 'campay' && provider !== 'maviance') throw new Error('Invalid provider');
    if (!rawPhone || typeof rawPhone !== 'string') throw new Error('Phone number required');

    const phone = normalizeCameroonPhone(rawPhone);
    if (!phone) throw new Error('Numéro invalide — utilisez un numéro camerounais (ex: 6XXXXXXXX ou 237 6XXXXXXXX).');

    const amount = TIER_AMOUNTS[tier];
    const externalReference = `devora-${crypto.randomUUID()}`;

    const { error: insertError } = await supabaseClient.from('payments').insert({
      user_id: user.id,
      provider,
      tier,
      amount_xaf: amount,
      phone,
      external_reference: externalReference,
      status: 'pending',
    });
    if (insertError) throw new Error(insertError.message);

    if (provider === 'campay') {
      const result = await initiateCamPay(amount, phone, externalReference);
      if (!result.ok) {
        await supabaseClient.from('payments').update({ status: 'failed' }).eq('external_reference', externalReference);
        throw new Error(result.error);
      }
      if (result.reference) {
        await supabaseClient.from('payments').update({ provider_reference: result.reference }).eq('external_reference', externalReference);
      }
    } else {
      const result = await initiateMaviance(amount, phone, externalReference);
      if (!result.ok) {
        await supabaseClient.from('payments').update({ status: 'failed' }).eq('external_reference', externalReference);
        throw new Error(result.error);
      }
    }

    return new Response(JSON.stringify({ success: true, reference: externalReference }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// CamPay offers a permanent access token (dashboard → Clés d'accès API →
// "Jeton d'accès permanent") as a simpler alternative to exchanging
// username/password for a short-lived token on every request. Prefer it
// when set; otherwise fall back to the username/password flow.
async function getCamPayToken(baseUrl: string): Promise<{ ok: true; token: string } | { ok: false; error: string }> {
  const permanentToken = Deno.env.get('CAMPAY_PERMANENT_TOKEN');
  if (permanentToken) return { ok: true, token: permanentToken };

  const username = Deno.env.get('CAMPAY_USERNAME');
  const password = Deno.env.get('CAMPAY_PASSWORD');
  if (!username || !password) {
    return { ok: false, error: 'CamPay n\'est pas encore configuré (CAMPAY_PERMANENT_TOKEN ou CAMPAY_USERNAME/CAMPAY_PASSWORD manquants).' };
  }

  try {
    const tokenRes = await fetch(`${baseUrl}/api/token/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!tokenRes.ok) return { ok: false, error: `CamPay auth failed (HTTP ${tokenRes.status})` };
    const { token } = await tokenRes.json();
    return { ok: true, token };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'CamPay auth request failed' };
  }
}

async function initiateCamPay(amount: number, phone: string, reference: string): Promise<{ ok: true; reference?: string } | { ok: false; error: string }> {
  const baseUrl = Deno.env.get('CAMPAY_BASE_URL') || 'https://demo.campay.net';
  const tokenResult = await getCamPayToken(baseUrl);
  if (!tokenResult.ok) return tokenResult;
  const { token } = tokenResult;

  try {
    const collectRes = await fetch(`${baseUrl}/api/collect/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Token ${token}` },
      body: JSON.stringify({
        amount: String(amount),
        currency: 'XAF',
        from: phone,
        description: 'Devora subscription',
        external_reference: reference,
      }),
    });
    if (!collectRes.ok) {
      const body = await collectRes.text();
      return { ok: false, error: `CamPay collect failed (HTTP ${collectRes.status}): ${body.slice(0, 200)}` };
    }
    const collectBody = await collectRes.json().catch(() => ({}));
    return { ok: true, reference: collectBody?.reference };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'CamPay request failed' };
  }
}

// Maviance integration — structured identically to CamPay above. The exact
// endpoint paths and payload fields are a best-effort placeholder and MUST be
// verified against Maviance's real API docs once sandbox credentials exist.
async function initiateMaviance(amount: number, phone: string, reference: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const baseUrl = Deno.env.get('MAVIANCE_BASE_URL');
  const apiKey = Deno.env.get('MAVIANCE_API_KEY');
  if (!baseUrl || !apiKey) {
    return { ok: false, error: 'Maviance n\'est pas encore configuré (MAVIANCE_BASE_URL/MAVIANCE_API_KEY manquants).' };
  }

  try {
    const res = await fetch(`${baseUrl}/collect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        amount,
        currency: 'XAF',
        phone,
        reference,
        description: 'Devora subscription',
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      return { ok: false, error: `Maviance collect failed (HTTP ${res.status}): ${body.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Maviance request failed' };
  }
}
