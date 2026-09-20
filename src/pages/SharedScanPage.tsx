import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AppLayout } from '@/components/AppLayout';
import { BusinessHeroCard } from '@/components/BusinessHeroCard';
import { BusinessAuditPanel } from '@/components/BusinessAuditPanel';
import { UpgradeNagDialog } from '@/components/UpgradeNagDialog';
import { getBusinessStory } from '@/lib/business-visuals';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import { useUsageLimits } from '@/hooks/useUsageLimits';
import { Business } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  X, ExternalLink, Phone, Globe, Star, Loader2, Navigation, Mail, MapPin,
  Eye, Unlock, LogIn, AlertTriangle,
} from 'lucide-react';

export default function SharedScanPage() {
  const { token } = useParams<{ token: string }>();
  const { user, loading: authLoading } = useAuth();
  const { t, lang } = useTranslation();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [access, setAccess] = useState<'view' | 'full'>('view');
  const [scanInfo, setScanInfo] = useState<{ lat: number; lng: number; radius: number; created_at: string } | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selected, setSelected] = useState<Business | null>(null);
  const [savingLead, setSavingLead] = useState(false);
  const [userPlan, setUserPlan] = useState('free');
  const [nag, setNag] = useState(false);
  const { canAudit, incrementAudit } = useUsageLimits(userPlan);

  useEffect(() => {
    if (authLoading || !user || !token) return;
    supabase.functions.invoke('check-subscription').then(({ data }) => {
      if (data?.plan) setUserPlan(data.plan);
    }).catch(() => {});

    supabase.functions.invoke('shared-scan', { body: { token } }).then(({ data, error: fnError }) => {
      if (fnError || !data || data.error) {
        setError(data?.error === 'not_found' ? 'not_found' : 'error');
        setLoading(false);
        return;
      }
      setAccess(data.access);
      setScanInfo(data.scan);
      setBusinesses((data.businesses || []).map((b: any) => ({
        id: b.id, name: b.name, address: b.address, city: b.city || undefined, district: b.district || undefined,
        phone: b.phone || undefined, email: b.email || undefined,
        category: b.category, rating: b.rating || undefined, website: b.website || undefined,
        lat: b.lat, lng: b.lng, hasWebsite: b.has_website, opportunityScore: b.opportunity_score || undefined,
      })));
      setLoading(false);
    });
  }, [authLoading, user, token]);

  const handleSaveLead = async (biz: Business) => {
    if (!user) return;
    setSavingLead(true);
    try {
      const { error: err } = await supabase.from('leads').insert({
        user_id: user.id, business_name: biz.name, business_address: biz.address,
        business_city: biz.city || null, business_district: biz.district || null,
        business_phone: biz.phone || null, business_email: biz.email || null, business_category: biz.category,
        business_rating: biz.rating || null, business_website: biz.website || null,
        has_website: biz.hasWebsite, opportunity_score: biz.opportunityScore || null,
        lat: biz.lat, lng: biz.lng, status: 'new',
      });
      if (err) throw err;
      toast({ title: t('scan.leadSaved'), description: `${biz.name} ${t('scan.leadSavedDesc')}` });
    } catch (err: any) {
      toast({ title: t('common.error'), description: err.message, variant: 'destructive' });
    } finally {
      setSavingLead(false);
    }
  };

  if (!authLoading && !user) {
    return (
      <AppLayout>
        <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <LogIn className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-lg font-bold">{lang === 'fr' ? 'Connectez-vous pour voir ce scan' : 'Sign in to view this scan'}</h1>
          <p className="text-sm text-muted-foreground">
            {lang === 'fr'
              ? 'Ce lien partagé nécessite un compte Devora. Connectez-vous ou créez un compte pour continuer.'
              : 'This shared link requires a Devora account. Sign in or create one to continue.'}
          </p>
          <Button asChild>
            <Link to={`/auth?redirect=${encodeURIComponent(`/shared/${token}`)}`}>{lang === 'fr' ? 'Se connecter' : 'Sign in'}</Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  if (loading || authLoading) {
    return <AppLayout><div className="max-w-7xl mx-auto px-4 py-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div></AppLayout>;
  }

  if (error) {
    return (
      <AppLayout>
        <div className="max-w-md mx-auto px-4 py-20 text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-destructive mx-auto" />
          <h1 className="text-lg font-bold">{lang === 'fr' ? 'Lien invalide ou expiré' : 'Invalid or expired link'}</h1>
          <p className="text-sm text-muted-foreground">
            {lang === 'fr' ? "Ce lien de partage n'existe plus." : 'This share link no longer exists.'}
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1">
            <h1 className="text-lg sm:text-xl font-bold">{businesses.length} {t('scan.businesses')}</h1>
            {scanInfo && (
              <p className="text-xs text-muted-foreground">
                {scanInfo.radius} km · {new Date(scanInfo.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            )}
          </div>
          <Badge variant="outline" className={`text-[10px] gap-1 ${access === 'full' ? 'border-primary/40 text-primary' : 'border-muted-foreground/40 text-muted-foreground'}`}>
            {access === 'full' ? <Unlock className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            {access === 'full'
              ? (lang === 'fr' ? 'Utilisable' : 'Usable')
              : (lang === 'fr' ? 'Lecture seule' : 'Read-only')}
          </Badge>
        </div>

        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 space-y-3">
            {businesses.map((biz, i) => (
              <BusinessHeroCard
                key={biz.id}
                business={biz}
                lang={lang as 'fr' | 'en'}
                rank={i}
                featured={i === 0}
                active={selected?.id === biz.id}
                onConsult={() => setSelected(biz)}
              />
            ))}
          </div>

          <div className="lg:col-span-1">
            <AnimatePresence mode="wait">
              {selected ? (
                <motion.div key={selected.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="space-y-3 lg:sticky lg:top-20">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-base sm:text-lg font-bold truncate">{selected.name}</h3>
                      <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{selected.category} · {selected.address}</p>
                    </div>
                    <Button size="icon" variant="ghost" className="shrink-0 h-7 w-7" onClick={() => setSelected(null)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="glass rounded-lg p-3">
                    <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                      {getBusinessStory({ name: selected.name, category: selected.category, address: selected.address, hasWebsite: selected.hasWebsite }, lang as 'fr' | 'en')}
                    </p>
                  </div>

                  <div className="glass rounded-lg p-3 space-y-1.5 text-xs sm:text-sm">
                    {(selected.district || selected.city) && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                        <span className="truncate">{[selected.district, selected.city].filter(Boolean).join(', ')}</span>
                      </div>
                    )}
                    {selected.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3 h-3 text-muted-foreground shrink-0" />
                        <a href={`tel:${selected.phone}`} className="hover:text-primary transition-colors truncate">{selected.phone}</a>
                      </div>
                    )}
                    {selected.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3 h-3 text-muted-foreground shrink-0" />
                        <a href={`mailto:${selected.email}`} className="hover:text-primary transition-colors truncate">{selected.email}</a>
                      </div>
                    )}
                    {selected.website ? (
                      <div className="flex items-center gap-2">
                        <Globe className="w-3 h-3 text-muted-foreground shrink-0" />
                        <a href={selected.website.startsWith('http') ? selected.website : `https://${selected.website}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1 truncate">
                          <span className="truncate">{selected.website}</span>
                          <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                        </a>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Globe className="w-3 h-3 text-muted-foreground shrink-0" />
                        <Badge variant="outline" className="text-[10px] border-opportunity/40 text-opportunity">{t('scan.noWebsiteBadge')}</Badge>
                      </div>
                    )}
                    {selected.rating && (
                      <div className="flex items-center gap-2">
                        <Star className="w-3 h-3 text-warning shrink-0" />
                        <span>{selected.rating}/5</span>
                      </div>
                    )}
                    {!!selected.lat && !!selected.lng && (
                      <a href={`https://www.google.com/maps/search/?api=1&query=${selected.lat},${selected.lng}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline pt-1">
                        <Navigation className="w-3 h-3 shrink-0" />
                        <span>{t('scan.directions')}</span>
                        <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                      </a>
                    )}
                  </div>

                  {selected.opportunityScore !== undefined && (
                    <div className="glass rounded-lg p-3 sm:p-4">
                      <div className="text-xs font-semibold mb-1">{t('scan.opportunityScore')}</div>
                      <div className="text-2xl sm:text-3xl font-mono font-black text-primary">{selected.opportunityScore}/10</div>
                    </div>
                  )}

                  {access === 'full' ? (
                    <>
                      <BusinessAuditPanel
                        business={selected}
                        canAudit={canAudit}
                        lang={lang as 'fr' | 'en'}
                        onAuditGenerated={incrementAudit}
                        onUpgradeClick={() => setNag(true)}
                      />
                      <Button size="sm" className="w-full h-9 text-xs" onClick={() => handleSaveLead(selected)} disabled={savingLead}>
                        {savingLead && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
                        {t('scan.save')}
                      </Button>
                    </>
                  ) : (
                    <div className="glass rounded-lg p-3 text-center">
                      <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1.5">
                        <Eye className="w-3.5 h-3.5" />
                        {lang === 'fr' ? 'Partage en lecture seule — consultation uniquement.' : 'Read-only share — viewing only.'}
                      </p>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-lg p-6 text-center">
                  <p className="text-xs sm:text-sm text-muted-foreground">{t('scan.selectBusiness')}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      <UpgradeNagDialog open={nag} onOpenChange={setNag} reason="audit" lang={lang as 'fr' | 'en'} />
    </AppLayout>
  );
}
