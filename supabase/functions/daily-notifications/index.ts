import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const REMINDER_AFTER_DAYS = 3;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: profiles } = await supabase.from('profiles').select('id');
    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const cutoff = new Date(Date.now() - REMINDER_AFTER_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const notifications: { user_id: string; title: string; message: string; type: string }[] = [];

    for (const p of profiles) {
      const { data: lastScan } = await supabase
        .from('scans')
        .select('created_at')
        .eq('user_id', p.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!lastScan || lastScan.created_at < cutoff) {
        notifications.push({
          user_id: p.id,
          title: 'Il est temps de scanner',
          message: "Votre dernière recherche remonte à plusieurs jours. De nouveaux commerces sans présence en ligne sont probablement apparus dans votre zone.",
          type: 'reminder',
        });
      } else {
        notifications.push({
          user_id: p.id,
          title: 'Nouvelles opportunités à proximité',
          message: "Élargissez votre recherche : scannez un nouveau quartier pour découvrir d'autres commerces ayant besoin d'une présence en ligne.",
          type: 'opportunity',
        });
      }
    }

    const { error } = await supabase.from('notifications').insert(notifications);
    if (error) throw error;

    return new Response(JSON.stringify({ sent: notifications.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
