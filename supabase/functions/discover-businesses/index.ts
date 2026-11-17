import { createClient } from 'npm:@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const GEOAPIFY_BASE = 'https://api.geoapify.com/v2/places';

const CATEGORY_GROUPS: { key: string; categories: string }[] = [
  { key: 'catering', categories: 'catering' },
  { key: 'commercial', categories: 'commercial' },
  { key: 'healthcare', categories: 'healthcare' },
  { key: 'accommodation', categories: 'accommodation.hotel,accommodation.hostel,accommodation.guest_house,accommodation.motel' },
  { key: 'education', categories: 'education' },
  { key: 'office_service', categories: 'office,service' },
  { key: 'leisure_sport', categories: 'leisure,sport' },
];

const RESULTS_PER_GROUP = 80; // per sector, per spatial chunk
const RESULTS_PER_QUERY_LARGE = 300; // combined-category fallback for mega-scans
const CONCURRENCY = 6;
const CATEGORY_KEYS = new Set(CATEGORY_GROUPS.map(group => group.key));

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let freeScanClaimed = false;
  let userId: string | null = null;
  const serviceClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } }
  );

  try {
    if (req.method !== 'POST') {
      return jsonResponse({ success: false, error: 'Method not allowed' }, 405);
    }

    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!token) return jsonResponse({ success: false, error: 'Connexion requise pour lancer un scan.' }, 401);

    const { data: authData, error: authError } = await serviceClient.auth.getUser(token);
    if (authError || !authData.user) {
      return jsonResponse({ success: false, error: 'Session invalide. Reconnectez-vous puis réessayez.' }, 401);
    }
    userId = authData.user.id;

    const apiKey = Deno.env.get('GEOAPIFY_API_KEY');
    if (!apiKey) {
      return jsonResponse({
        success: false,
        error: 'GEOAPIFY_API_KEY manquante. Configurez ce secret côté Supabase Edge Functions pour activer le scan.',
      }, 500);
    }

    const body = await req.json();
    const { lat, lng, radius = 5 } = body;
    const requestedDomains = body.domains as unknown;
    if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lng) || lng < -180 || lng > 180) {
      return jsonResponse({ success: false, error: 'Coordonnées GPS invalides.' }, 400);
    }
    if (!Number.isFinite(radius) || radius <= 0 || radius > 500) {
      return jsonResponse({ success: false, error: 'Rayon de scan invalide.' }, 400);
    }
    if (requestedDomains !== undefined && (!Array.isArray(requestedDomains) || requestedDomains.some(key => typeof key !== 'string' || !CATEGORY_KEYS.has(key)))) {
      return jsonResponse({ success: false, error: 'Un ou plusieurs domaines sélectionnés sont invalides.' }, 400);
    }
    if (requestedDomains !== undefined && requestedDomains.length === 0) {
      return jsonResponse({ success: false, error: 'Sélectionnez au moins un domaine à scanner.' }, 400);
    }

    const { data: profile, error: profileError } = await serviceClient
      .from('profiles')
      .select('plan, plan_expires_at')
      .eq('id', userId)
      .single();
    if (profileError || !profile) throw new Error('Impossible de vérifier le forfait du compte.');

    const premium = profile.plan === 'premium'
      && (!profile.plan_expires_at || new Date(profile.plan_expires_at).getTime() > Date.now());
    if (!premium && radius > 10) {
      return jsonResponse({ success: false, error: 'Le forfait gratuit est limité à un rayon de 10 km.' }, 403);
    }
    if (!premium && requestedDomains !== undefined) {
      return jsonResponse({ success: false, error: 'Le filtre par domaine est réservé au forfait Premium.' }, 403);
    }

    if (!premium) {
      const { error: claimError } = await serviceClient
        .from('free_scan_usage')
        .insert({ user_id: userId });
      if (claimError?.code === '23505') {
        return jsonResponse({
          success: false,
          code: 'FREE_SCAN_USED',
          error: 'Votre scan gratuit unique a déjà été utilisé. Passez au Premium pour continuer.',
        }, 403);
      }
      if (claimError) throw new Error('Impossible de vérifier le quota du scan gratuit.');
      freeScanClaimed = true;
    }

    console.log(`Scan at ${lat},${lng} radius ${radius}km`);

    const cappedRadius = Math.min(radius, 500);
    const isMegaScan = cappedRadius > 100;
    const selectedGroups = requestedDomains === undefined
      ? CATEGORY_GROUPS
      : CATEGORY_GROUPS.filter(group => (requestedDomains as string[]).includes(group.key));
    const chunks = isMegaScan
      ? generateGridChunks(lat, lng, cappedRadius)
      : [{ lat, lng, radius: cappedRadius }];

    const tasks: { lat: number; lng: number; radius: number; categories: string; limit: number }[] = isMegaScan
      ? chunks.map(c => ({ lat: c.lat, lng: c.lng, radius: c.radius, categories: selectedGroups.map(g => g.categories).join(','), limit: RESULTS_PER_QUERY_LARGE }))
      : chunks.flatMap(c => selectedGroups.map(g => ({ lat: c.lat, lng: c.lng, radius: c.radius, categories: g.categories, limit: RESULTS_PER_GROUP })));

    console.log(`Querying Geoapify across ${tasks.length} task(s) (${chunks.length} chunk(s), mega=${isMegaScan})`);

    const allFeatures: any[] = [];
    const errors: string[] = [];

    for (let i = 0; i < tasks.length; i += CONCURRENCY) {
      const batch = tasks.slice(i, i + CONCURRENCY);
      const results = await Promise.allSettled(
        batch.map(t => queryGeoapify(t.lat, t.lng, t.radius, t.categories, t.limit, apiKey))
      );
      for (const r of results) {
        if (r.status === 'fulfilled') {
          allFeatures.push(...r.value);
        } else {
          errors.push(String(r.reason));
        }
      }
    }

    if (allFeatures.length === 0 && errors.length > 0 && errors.length === tasks.length) {
      // Every single request failed outright — this is a real error, not "no businesses nearby".
      console.error('All Geoapify queries failed:', errors);
      await releaseFreeScanClaim();
      return jsonResponse({
        success: false,
        error: `La recherche de commerces a échoué (${errors[0]}). Réessayez dans un instant.`,
      }, 502);
    }

    const seen = new Set<string>();
    const businesses = allFeatures
      .map(mapFeatureToBusiness)
      .filter((b): b is NonNullable<typeof b> => {
        if (!b) return false;
        if (distanceKm(lat, lng, b.lat, b.lng) > cappedRadius) return false;
        const key = `${b.name.toLowerCase().trim()}-${Math.round(b.lat * 100)}-${Math.round(b.lng * 100)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

    console.log(`Found ${businesses.length} businesses (${errors.length} task failures)`);

    return jsonResponse({ success: true, premium, businesses });
  } catch (error) {
    console.error('Error:', error);
    await releaseFreeScanClaim();
    return jsonResponse({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }

  async function releaseFreeScanClaim() {
    if (!freeScanClaimed || !userId) return;
    const { error } = await serviceClient.from('free_scan_usage').delete().eq('user_id', userId);
    if (error) console.error('Could not release failed free scan claim:', error);
    freeScanClaimed = false;
  }
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRadians = (degrees: number) => degrees * Math.PI / 180;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function generateGridChunks(lat: number, lng: number, radiusKm: number): { lat: number; lng: number; radius: number }[] {
  const chunkRadius = 50; // 50km per chunk
  const stepKm = chunkRadius * 1.4; // overlap slightly
  const steps = Math.ceil(radiusKm / stepKm);
  const chunks: { lat: number; lng: number; radius: number }[] = [];

  for (let i = -steps; i <= steps; i++) {
    for (let j = -steps; j <= steps; j++) {
      const dlat = (i * stepKm) / 111.0;
      const dlng = (j * stepKm) / (111.0 * Math.cos(lat * Math.PI / 180));
      const clat = lat + dlat;
      const clng = lng + dlng;

      const dist = Math.sqrt(Math.pow((clat - lat) * 111, 2) + Math.pow((clng - lng) * 111 * Math.cos(lat * Math.PI / 180), 2));
      if (dist <= radiusKm + chunkRadius) {
        chunks.push({ lat: clat, lng: clng, radius: chunkRadius });
      }
    }
  }

  return chunks.slice(0, 25);
}

async function queryGeoapify(lat: number, lng: number, radiusKm: number, categories: string, limit: number, apiKey: string): Promise<any[]> {
  const radiusMeters = Math.round(radiusKm * 1000);
  const url = `${GEOAPIFY_BASE}?categories=${categories}&filter=circle:${lng},${lat},${radiusMeters}&bias=proximity:${lng},${lat}&limit=${limit}&details=contact_extended,contact&apiKey=${apiKey}`;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
      if (response.ok) {
        const data = await response.json();
        return data.features || [];
      }
      const body = await response.text();
      console.error(`Geoapify returned ${response.status} for ${lat},${lng} [${categories}]: ${body.slice(0, 200)}`);
      if (response.status === 429) {
        await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
        continue;
      }
      throw new Error(`Geoapify HTTP ${response.status}`);
    } catch (e) {
      if (attempt === 1) throw e;
      await new Promise(r => setTimeout(r, 300));
    }
  }
  return [];
}

function mapFeatureToBusiness(feature: any) {
  const p = feature?.properties;
  if (!p?.name) return null;

  const lat = feature.geometry?.coordinates?.[1] ?? p.lat;
  const lng = feature.geometry?.coordinates?.[0] ?? p.lon;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  // Geoapify Places data is OSM-derived, so raw OSM contact tags are often mirrored
  // in datasource.raw — fall back to those when the normalized `contact` group
  // (requested via `details=contact_extended,contact`) is absent.
  const raw = p.datasource?.raw || {};
  const contact = p.contact || {};
  const website = p.website || contact.website || raw.website || raw['contact:website'] || raw.url || raw.website2 || null;
  const phone = p.phone || contact.phone || raw.phone || raw['contact:phone'] || raw['contact:mobile']
    || raw.mobile || raw.telephone || raw['phone_1'] || raw['contact:phone_1'] || null;
  const email = contact.email || raw.email || raw['contact:email'] || raw['email_1'] || raw['contact:email_1'] || null;
  const facebook = contact.facebook || raw['contact:facebook'] || raw.facebook || null;
  const instagram = contact.instagram || raw['contact:instagram'] || raw.instagram || null;
  const whatsapp = contact.whatsapp || raw['contact:whatsapp'] || raw.whatsapp || null;
  const openingHours = p.opening_hours || raw.opening_hours || null;
  const hasWebsite = !!website;

  const opportunityReasons: string[] = [];
  if (!hasWebsite) opportunityReasons.push('no_website');
  if (!phone) opportunityReasons.push('no_phone');
  if (!email) opportunityReasons.push('no_email');
  if (!facebook && !instagram && !whatsapp) opportunityReasons.push('no_social');
  if (!openingHours) opportunityReasons.push('no_opening_hours');
  const opportunityScore = hasWebsite
    ? Math.min(7, opportunityReasons.filter(reason => reason !== 'no_website').length * 1.5)
    : 10;

  return {
    id: `geoapify-${p.place_id || `${lat}-${lng}-${p.name}`}`,
    name: p.name as string,
    address: formatAddress(p),
    city: p.city || p.county || null,
    district: p.suburb || p.district || null,
    phone, email, website,
    facebook, instagram, whatsapp,
    openingHours,
    hasWebsite,
    category: formatCategory(p.categories),
    discoveryDomains: getDiscoveryDomains(p.categories),
    lat, lng,
    rating: null,
    opportunityScore,
    opportunityReasons,
  };
}

function formatAddress(p: any): string {
  if (p.formatted) return p.formatted;
  const parts = [p.housenumber, p.street, p.city, p.postcode].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : 'Adresse non disponible';
}

function formatCategory(categories: string[] | undefined): string {
  if (!categories || categories.length === 0) return 'Commerce';
  // Categories look like "commercial.supermarket" — take the most specific segment.
  const specific = categories.find(c => c.includes('.')) || categories[0];
  const label = specific.split('.').pop() || specific;
  return label.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function getDiscoveryDomains(categories: string[] | undefined): string[] {
  if (!categories) return [];
  const normalized = categories.map(category => category.toLowerCase());
  return CATEGORY_GROUPS
    .filter(group => group.categories.split(',').some(prefix =>
      normalized.some(category => category === prefix || category.startsWith(`${prefix}.`))
    ))
    .map(group => group.key);
}
