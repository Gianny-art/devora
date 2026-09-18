const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const GEOAPIFY_BASE = 'https://api.geoapify.com/v2/places';

// Split by sector and queried separately (each with its own result budget) so a
// data-dense sector (e.g. hotels in a given neighborhood) can't crowd out
// restaurants, gyms, schools, shops, etc. from the combined result set.
const CATEGORY_GROUPS: { key: string; categories: string }[] = [
  { key: 'catering', categories: 'catering' }, // restaurants, cafes, bars, bakeries
  { key: 'commercial', categories: 'commercial' }, // shops, supermarkets, retail, electronics
  { key: 'healthcare', categories: 'healthcare' }, // pharmacy, clinic, hospital, dentist
  { key: 'accommodation', categories: 'accommodation.hotel,accommodation.hostel,accommodation.guest_house,accommodation.motel' },
  { key: 'education', categories: 'education' }, // schools, colleges
  { key: 'office_service', categories: 'office,service' },
  { key: 'leisure_sport', categories: 'leisure,sport' }, // gyms, fitness, sports centres
];

const RESULTS_PER_GROUP = 80; // per sector, per spatial chunk
const RESULTS_PER_QUERY_LARGE = 300; // combined-category fallback for mega-scans
const CONCURRENCY = 6;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('GEOAPIFY_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({
        success: false,
        error: 'GEOAPIFY_API_KEY manquante. Configurez ce secret côté Supabase Edge Functions pour activer le scan.',
      }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { lat, lng, radius = 5 } = await req.json();
    if (!lat || !lng) {
      return new Response(JSON.stringify({ success: false, error: 'lat and lng required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log(`Scan at ${lat},${lng} radius ${radius}km`);

    const cappedRadius = Math.min(radius, 500);
    const isMegaScan = cappedRadius > 100;
    const chunks = isMegaScan
      ? generateGridChunks(lat, lng, cappedRadius)
      : [{ lat, lng, radius: cappedRadius }];

    // Per-sector fan-out for normal scans (accurate category diversity); a single
    // combined-category query per chunk for mega-scans (bounds total request count).
    const tasks: { lat: number; lng: number; radius: number; categories: string; limit: number }[] = isMegaScan
      ? chunks.map(c => ({ lat: c.lat, lng: c.lng, radius: c.radius, categories: CATEGORY_GROUPS.map(g => g.categories).join(','), limit: RESULTS_PER_QUERY_LARGE }))
      : chunks.flatMap(c => CATEGORY_GROUPS.map(g => ({ lat: c.lat, lng: c.lng, radius: c.radius, categories: g.categories, limit: RESULTS_PER_GROUP })));

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
      return new Response(JSON.stringify({
        success: false,
        error: `La recherche de commerces a échoué (${errors[0]}). Réessayez dans un instant.`,
      }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const seen = new Set<string>();
    const businesses = allFeatures
      .map(mapFeatureToBusiness)
      .filter((b): b is NonNullable<typeof b> => {
        if (!b) return false;
        const key = `${b.name.toLowerCase().trim()}-${Math.round(b.lat * 100)}-${Math.round(b.lng * 100)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

    console.log(`Found ${businesses.length} businesses (${errors.length} task failures)`);

    return new Response(JSON.stringify({ success: true, businesses }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

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
  if (!lat || !lng) return null;

  // Geoapify Places data is OSM-derived, so raw OSM contact tags are often mirrored
  // in datasource.raw — fall back to those when the normalized `contact` group
  // (requested via `details=contact_extended,contact`) is absent.
  const raw = p.datasource?.raw || {};
  const contact = p.contact || {};
  const website = p.website || contact.website || raw.website || raw['contact:website'] || null;
  const phone = p.phone || contact.phone || raw.phone || raw['contact:phone'] || raw['contact:mobile'] || null;
  const email = contact.email || raw.email || raw['contact:email'] || null;
  const facebook = contact.facebook || raw['contact:facebook'] || raw.facebook || null;
  const instagram = contact.instagram || raw['contact:instagram'] || raw.instagram || null;
  const whatsapp = contact.whatsapp || raw['contact:whatsapp'] || raw.whatsapp || null;
  const openingHours = p.opening_hours || raw.opening_hours || null;
  const hasWebsite = !!website;

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
    lat, lng,
    rating: null,
    opportunityScore: hasWebsite ? Math.round((3 + Math.random() * 4) * 10) / 10 : Math.round((8 + Math.random() * 2) * 10) / 10,
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
