import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import { supabase } from '@/integrations/supabase/client';
import { getTopCategories } from '@/lib/interest';
import { getBusinessVisual } from '@/lib/business-visuals';
import { Button } from '@/components/ui/button';
import { Sparkles, Lock, Zap, Radar } from 'lucide-react';
import { motion } from 'framer-motion';

// Reverse-lookup: given a display label, find a representative category keyword
// (VISUALS entries key off substrings, so any of its keys works as a search hint).
function findVisualImage(label: string, lang: 'fr' | 'en'): string {
  const all = ['restaurant', 'cafe', 'bar', 'bakery', 'hotel', 'pharmacy', 'hairdresser', 'car', 'gym', 'school', 'bank', 'construction', 'clothes', 'supermarket', 'computer', 'travel', 'shop'];
  for (const key of all) {
    if (getBusinessVisual(key).label[lang] === label) return getBusinessVisual(key).image;
  }
  return getBusinessVisual(null).image;
}

export default function SuggestionsPage() {
  const { user } = useAuth();
  const { t, lang } = useTranslation();
  const navigate = useNavigate();
  const [userPlan, setUserPlan] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.functions.invoke('check-subscription').then(({ data }) => {
      setUserPlan(data?.plan || 'free');
    }).catch(() => setUserPlan('free'));
  }, [user]);

  const isPremium = userPlan === 'premium' || userPlan === 'premium_plus';
  const topCategories = getTopCategories(6);

  if (!user) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground">{t('scan.loginRequired')}</p>
        </div>
      </AppLayout>
    );
  }

  if (userPlan !== null && !isPremium) {
    return (
      <AppLayout>
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-xl font-bold mb-2">{lang === 'fr' ? 'Suggestions intelligentes' : 'Smart suggestions'}</h1>
          <p className="text-sm text-muted-foreground mb-6">
            {lang === 'fr'
              ? 'Fonctionnalité Premium : Devora analyse vos habitudes de scan et vous recommande les secteurs et zones les plus prometteurs.'
              : 'Premium feature: Devora analyzes your scanning habits and recommends the most promising sectors and areas.'}
          </p>
          <Button className="gap-1.5" onClick={() => navigate('/pricing')}>
            <Zap className="w-4 h-4" /> {lang === 'fr' ? 'Voir les plans Premium' : 'View Premium plans'}
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" /> {lang === 'fr' ? 'Suggestions intelligentes' : 'Smart suggestions'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {lang === 'fr'
              ? 'Basées sur les secteurs que vous consultez et sauvegardez le plus souvent.'
              : 'Based on the sectors you consult and save the most.'}
          </p>
        </div>

        {topCategories.length === 0 ? (
          <div className="glass rounded-lg p-10 text-center">
            <Radar className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {lang === 'fr'
                ? "Pas encore assez de données. Consultez ou sauvegardez quelques entreprises pendant vos scans pour recevoir des suggestions personnalisées."
                : "Not enough data yet. Consult or save a few businesses during your scans to get personalized suggestions."}
            </p>
            <Button size="sm" className="mt-4" onClick={() => navigate('/scan')}>{t('nav.scanner')}</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {topCategories.map((c, i) => (
              <motion.div
                key={c.category}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="relative overflow-hidden rounded-2xl border border-border/60 h-40"
              >
                <img src={findVisualImage(c.category, lang as 'fr' | 'en')} alt={c.category} className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-primary mb-1">
                    {i === 0 ? (lang === 'fr' ? 'Priorité n°1' : 'Top priority') : `#${i + 1}`}
                  </p>
                  <h3 className="text-lg font-bold">{c.category}</h3>
                  <Button size="sm" variant="outline" className="mt-2 h-7 text-[11px] bg-background/60 backdrop-blur-md" onClick={() => navigate('/scan')}>
                    {lang === 'fr' ? 'Scanner ce secteur' : 'Scan this sector'}
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
