import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const devTips = [
  { fr: "💡 Astuce dev : Toujours vérifier la version mobile du site d'un prospect avant de le contacter.", en: "💡 Dev tip: Always check the mobile version of a prospect's site before reaching out." },
  { fr: "🎯 Conseil : Un audit détaillé avec des captures d'écran convainc 3x plus qu'un email générique.", en: "🎯 Tip: A detailed audit with screenshots convinces 3x more than a generic email." },
  { fr: "🚀 Le SEO local est souvent négligé — c'est un argument de vente puissant pour les PME.", en: "🚀 Local SEO is often neglected — it's a powerful selling point for SMBs." },
  { fr: "📊 Montrez le score PageSpeed du site du prospect — les chiffres parlent.", en: "📊 Show the prospect's PageSpeed score — numbers speak louder." },
  { fr: "✨ Proposez toujours un 'quick win' gratuit pour établir la confiance.", en: "✨ Always offer a free 'quick win' to build trust." },
  { fr: "🔍 Vérifiez si le prospect est sur Google Maps — sinon, proposez-le comme service additionnel.", en: "🔍 Check if the prospect is on Google Maps — if not, offer it as an extra service." },
  { fr: "💼 Un portfolio avec des cas similaires au secteur du prospect augmente vos chances de 60%.", en: "💼 A portfolio with cases similar to the prospect's industry increases your chances by 60%." },
  { fr: "📱 Plus de 60% du trafic web est mobile — un site non responsive est une opportunité en or.", en: "📱 Over 60% of web traffic is mobile — a non-responsive site is a golden opportunity." },
  { fr: "🤝 Le suivi est clé : relancez 3 jours après le premier contact.", en: "🤝 Follow-up is key: reach out again 3 days after first contact." },
  { fr: "⚡ Utilisez Devora pour scanner de nouveaux quartiers chaque semaine.", en: "⚡ Use Devora to scan new areas every week." },
];

const businessAlerts = [
  { fr: "🏪 Des entreprises sans site web ont été détectées dans votre zone — lancez un scan pour les découvrir !", en: "🏪 Businesses without websites detected in your area — run a scan to discover them!" },
  { fr: "📍 Rappel : scannez votre quartier aujourd'hui pour trouver de nouvelles opportunités.", en: "📍 Reminder: scan your neighborhood today to find new opportunities." },
  { fr: "🔔 De nouveaux commerces s'installent chaque semaine — restez en veille avec Devora.", en: "🔔 New businesses open every week — stay ahead with Devora." },
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Get all users
    const { data: profiles } = await supabase.from('profiles').select('id');
    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const tip = devTips[Math.floor(Math.random() * devTips.length)];
    const alert = businessAlerts[Math.floor(Math.random() * businessAlerts.length)];

    const notifications = profiles.flatMap(p => [
      {
        user_id: p.id,
        title: '💡 Conseil du jour',
        message: tip.fr,
        type: 'tip',
      },
      {
        user_id: p.id,
        title: '📍 Opportunité locale',
        message: alert.fr,
        type: 'opportunity',
      },
    ]);

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
