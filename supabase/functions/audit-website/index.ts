import { createClient } from 'npm:@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const CATEGORY_IDS = ['performance', 'accessibility', 'best-practices', 'seo'] as const;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return respond({ error: 'Method not allowed' }, 405);

  try {
    const token = req.headers.get('Authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!token) return respond({ error: 'Connexion requise.' }, 401);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } },
    );
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData.user) return respond({ error: 'Session invalide. Reconnectez-vous.' }, 401);

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('plan, plan_expires_at')
      .eq('id', authData.user.id)
      .single();
    if (profileError || !profile) throw new Error('Impossible de vérifier le forfait du compte.');
    const hasPremium = profile.plan === 'premium'
      && (!profile.plan_expires_at || new Date(profile.plan_expires_at).getTime() > Date.now());
    if (!hasPremium) return respond({ error: 'L’audit technique des sites est réservé au forfait Premium.' }, 403);

    const apiKey = Deno.env.get('PAGESPEED_API_KEY');
    if (!apiKey) return respond({ error: 'Audit indisponible : configurez le secret PAGESPEED_API_KEY dans Supabase.' }, 503);

    const body = await req.json();
    if (typeof body.website !== 'string' || body.website.length > 2048) {
      return respond({ error: 'Adresse de site invalide.' }, 400);
    }

    let target: URL;
    try {
      target = new URL(body.website.startsWith('http') ? body.website : `https://${body.website}`);
    } catch {
      return respond({ error: 'Adresse de site invalide.' }, 400);
    }
    if (!['http:', 'https:'].includes(target.protocol) || target.username || target.password || !isPublicHostname(target.hostname)) {
      return respond({ error: 'Seuls les sites publics avec une adresse HTTP ou HTTPS valide peuvent être analysés.' }, 400);
    }

    const endpoint = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed');
    endpoint.searchParams.set('url', target.toString());
    endpoint.searchParams.set('strategy', 'mobile');
    endpoint.searchParams.set('key', apiKey);
    endpoint.searchParams.set('locale', body.lang === 'en' ? 'en' : 'fr');
    for (const category of CATEGORY_IDS) endpoint.searchParams.append('category', category);

    const response = await fetch(endpoint, { signal: AbortSignal.timeout(45000) });
    if (!response.ok) {
      const bodyText = await response.text();
      console.error(`PageSpeed API returned ${response.status}: ${bodyText.slice(0, 300)}`);
      return respond({
        error: response.status === 429
          ? 'Quota PageSpeed atteint. Réessayez plus tard.'
          : `Google PageSpeed n’a pas pu analyser ce site (HTTP ${response.status}).`,
      }, response.status === 429 ? 429 : 502);
    }

    const report = await response.json();
    const categories = report.lighthouseResult?.categories || {};
    const audits = report.lighthouseResult?.audits || {};
    const scores = Object.fromEntries(CATEGORY_IDS.map(id => [id, toPercent(categories[id]?.score)]));
    const categoryTitles: Record<string, string> = {
      performance: 'Performance',
      accessibility: 'Accessibilité',
      'best-practices': 'Bonnes pratiques',
      seo: 'SEO',
    };
    const issues = CATEGORY_IDS.flatMap(id => {
      const refs = categories[id]?.auditRefs || [];
      return refs.flatMap((ref: { id: string; weight?: number }) => {
        const audit = audits[ref.id];
        if (!audit || audit.score === null || audit.score >= 0.9 || !audit.title) return [];
        return [{
          category: categoryTitles[id],
          title: audit.title,
          description: audit.description?.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') || '',
          score: toPercent(audit.score),
        }];
      });
    }).slice(0, 10);

    const metricIds = ['first-contentful-paint', 'largest-contentful-paint', 'speed-index', 'interactive', 'cumulative-layout-shift'];
    const metrics = metricIds.flatMap(id => {
      const audit = audits[id];
      return audit ? [{ id, label: audit.title, value: audit.displayValue || null, score: toPercent(audit.score) }] : [];
    });

    return respond({
      website: target.toString(),
      fetchedAt: new Date().toISOString(),
      scores,
      issues,
      metrics,
      lighthouseVersion: report.lighthouseResult?.lighthouseVersion || null,
    });
  } catch (error) {
    console.error('Website audit failed:', error);
    return respond({ error: error instanceof Error ? error.message : 'Erreur inconnue pendant l’audit.' }, 500);
  }
});

function isPublicHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (!host.includes('.') || host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.includes(':')) return false;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return false;
  return true;
}

function toPercent(score: number | null | undefined): number | null {
  return typeof score === 'number' && Number.isFinite(score) ? Math.round(score * 100) : null;
}

function respond(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
