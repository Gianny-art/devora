import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppLayout } from '@/components/AppLayout';
import { RadarScanner } from '@/components/RadarScanner';
import { BusinessHeroCard } from '@/components/BusinessHeroCard';
import { BusinessAuditPanel } from '@/components/BusinessAuditPanel';
import { UpgradeNagDialog } from '@/components/UpgradeNagDialog';
import { getBusinessVisual, getBusinessStory } from '@/lib/business-visuals';
import { recordInterest } from '@/lib/interest';

import { BusinessMap } from '@/components/BusinessMap';
import { useScanner } from '@/hooks/use-scanner';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import { Business } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { isAdmin, getAvailableRadii } from '@/lib/admin';
import { useUsageLimits } from '@/hooks/useUsageLimits';
import {
  Map as MapIcon, List, SlidersHorizontal, X, ExternalLink, Phone, Globe, Star, Loader2,
  ChevronLeft, ChevronRight, Lock, ArrowUp, Navigation, Mail,
} from 'lucide-react';

const PAGE_SIZE = 8;

export default function ScanPage() {
  const { businesses, scanning, scanComplete, scanError, duplicateWarning, startScan, position } = useScanner();
  const { user } = useAuth();
  const { toast } = useToast();
  const { t, lang } = useTranslation();
  const [view, setView] = useState<'map' | 'list'>('list');
  const [selected, setSelected] = useState<Business | null>(null);
  const [radius, setRadius] = useState<number | null>(null);
  const [savingLead, setSavingLead] = useState(false);
  const [page, setPage] = useState(0);
  const [userPlan, setUserPlan] = useState('free');
  const [showAll, setShowAll] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [nag, setNag] = useState<'scan' | 'audit' | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.functions.invoke('check-subscription').then(({ data }) => {
      if (data?.plan) setUserPlan(data.plan);
    }).catch(() => {});
  }, [user]);

  const userIsAdmin = isAdmin(user?.email);
  const availableRadii = getAvailableRadii(userPlan, user?.email);
  const {
    scanCount, limits,
    canScan, canAudit,
    incrementScan, incrementAudit,
  } = useUsageLimits(userPlan);

  // Only businesses that actually need digital help by default (no website),
  // with an explicit toggle to also see the ones that already have a site.
  const needsHelp = useMemo(() => businesses.filter(b => showAll || !b.hasWebsite), [businesses, showAll]);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const b of needsHelp) {
      const label = getBusinessVisual(b.category).label[lang as 'fr' | 'en'];
      counts.set(label, (counts.get(label) || 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [needsHelp, lang]);

  const filtered = useMemo(() => {
    const base = categoryFilter
      ? needsHelp.filter(b => getBusinessVisual(b.category).label[lang as 'fr' | 'en'] === categoryFilter)
      : needsHelp;
    return [...base].sort((a, b) => (b.opportunityScore || 0) - (a.opportunityScore || 0));
  }, [needsHelp, categoryFilter, lang]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pagedBusinesses = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const noWebsite = businesses.filter(b => !b.hasWebsite).length;
  const withWebsite = businesses.filter(b => b.hasWebsite).length;

  const handleSaveLead = async (biz: Business) => {
    if (!user) {
      toast({ title: t('scan.loginRequired'), description: t('scan.loginToSave'), variant: 'destructive' });
      return;
    }
    setSavingLead(true);
    try {
      const { error } = await supabase.from('leads').insert({
        user_id: user.id,
        business_name: biz.name,
        business_address: biz.address,
        business_phone: biz.phone || null,
        business_category: biz.category,
        business_rating: biz.rating || null,
        business_website: biz.website || null,
        has_website: biz.hasWebsite,
        opportunity_score: biz.opportunityScore || null,
        lat: biz.lat,
        lng: biz.lng,
        status: 'new',
      });
      if (error) throw error;
      recordInterest(getBusinessVisual(biz.category).label[lang as 'fr' | 'en'], 3);
      toast({ title: t('scan.leadSaved'), description: `${biz.name} ${t('scan.leadSavedDesc')}` });
    } catch (err: any) {
      toast({ title: t('common.error'), description: err.message, variant: 'destructive' });
    } finally {
      setSavingLead(false);
    }
  };

  const smoothScrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 72;
    window.scrollTo({ top, behavior: 'smooth' });
  };

  const handleSelectBusiness = (biz: Business) => {
    setSelected(biz);
    recordInterest(getBusinessVisual(biz.category).label[lang as 'fr' | 'en'], 1);
    setTimeout(() => smoothScrollTo('business-detail'), 120);
  };

  const backToList = () => smoothScrollTo('scan-results-list');

  const handleNewScan = () => {
    if (!radius) return;
    if (!canScan) {
      setNag('scan');
      return;
    }
    startScan(radius, user?.id);
    incrementScan();
    setSelected(null);
    setPage(0);
    setShowAll(false);
    setCategoryFilter(null);
  };

  const handleFirstScan = () => {
    if (!radius) return;
    if (!canScan) {
      setNag('scan');
      return;
    }
    startScan(radius, user?.id);
    incrementScan();
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {!scanComplete && !scanError && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="text-2xl sm:text-3xl font-bold text-center mb-2">{t('scan.title')}</h1>
              <p className="text-muted-foreground text-center text-xs sm:text-sm mb-6 px-4">{t('scan.desc')}</p>
            </motion.div>

            <RadarScanner
              scanning={scanning}
              onScan={handleFirstScan}
              disabled={!radius}
              label={lang === 'fr' ? 'Scanner' : 'Scan'}
              scanningLabel={t('scan.scanning')}
            />

            <div className="flex flex-col items-center gap-2 mt-4">
              <span className="text-xs text-muted-foreground mb-1">{t('scan.radius')}</span>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {availableRadii.map(r => (
                  <button
                    key={r}
                    onClick={() => setRadius(r)}
                    className={`relative px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 border ${
                      radius === r
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'border-border text-muted-foreground hover:border-primary/50 hover:text-primary/80'
                    }`}
                  >
                    {r} km
                    {radius === r && (
                      <motion.span
                        layoutId="radius-indicator"
                        className="absolute inset-0 rounded-full border-2 border-primary"
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                  </button>
                ))}
              </div>
              {!radius && (
                <p className="text-[10px] text-muted-foreground/60 mt-1">{t('scan.selectRadius')}</p>
              )}
              {userPlan === 'free' && (
                <p className="text-[10px] text-muted-foreground mt-1">
                  {scanCount}/{limits.maxScansTotal} {lang === 'fr' ? 'scans utilisés' : 'scans used'}
                </p>
              )}
              {!userIsAdmin && userPlan === 'free' && (
                <Button size="sm" variant="ghost" className="text-xs h-7 text-muted-foreground mt-1" asChild>
                  <a href="/pricing">
                    <Lock className="w-3 h-3 mr-1" /> {t('scan.unlockMore')}
                  </a>
                </Button>
              )}
            </div>

            {scanning && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs sm:text-sm text-muted-foreground font-mono">
                {t('scan.scanning')} ({radius}km)...
              </motion.p>
            )}
          </div>
        )}

        {scanError && !scanComplete && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
            <p className="text-destructive text-sm text-center px-4">{scanError}</p>
            <Button onClick={() => { if (radius) startScan(radius); }} disabled={!radius}>{t('scan.retry')}</Button>
          </div>
        )}

        {scanComplete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {duplicateWarning && (
              <div className="mb-4 p-3 rounded-lg border border-warning/40 bg-warning/10 text-xs sm:text-sm text-warning-foreground">
                <span className="font-semibold">⚠ </span>{duplicateWarning}
                <a href="/dashboard" className="ml-2 text-primary underline text-xs">Voir l'historique</a>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
              <h2 className="text-lg sm:text-xl font-bold mr-auto">
                {filtered.length} {t('scan.businesses')}
              </h2>
              <Badge variant="outline" className="text-[10px] sm:text-xs border-score-none/40 text-score-none">
                {noWebsite} {t('scan.noSite')}
              </Badge>
              <Badge variant="outline" className="text-[10px] sm:text-xs border-score-good/40 text-score-good">
                {withWebsite} {t('scan.withSite')}
              </Badge>
              <div className="flex items-center gap-1">
                <Button size="sm" variant={view === 'list' ? 'secondary' : 'ghost'} onClick={() => setView('list')} className="h-7 w-7 p-0">
                  <List className="w-3.5 h-3.5" />
                </Button>
                <Button size="sm" variant={view === 'map' ? 'secondary' : 'ghost'} onClick={() => setView('map')} className="h-7 w-7 p-0">
                  <MapIcon className="w-3.5 h-3.5" />
                </Button>
              </div>
              <Button size="sm" variant="outline" onClick={handleNewScan} className="h-7 text-xs">
                <SlidersHorizontal className="w-3 h-3 mr-1" /> {t('scan.rescan')}
              </Button>
            </div>

            {/* Category filter chips — most critical business types surface first */}
            {categories.length > 1 && (
              <div className="flex flex-wrap items-center gap-1.5 mb-3">
                <button
                  onClick={() => setCategoryFilter(null)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
                    !categoryFilter ? 'bg-primary/10 border-primary text-primary' : 'border-border text-muted-foreground hover:border-primary/40'
                  }`}
                >
                  {lang === 'fr' ? 'Tous' : 'All'} ({needsHelp.length})
                </button>
                {categories.map(([label, count]) => (
                  <button
                    key={label}
                    onClick={() => setCategoryFilter(categoryFilter === label ? null : label)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
                      categoryFilter === label ? 'bg-primary/10 border-primary text-primary' : 'border-border text-muted-foreground hover:border-primary/40'
                    }`}
                  >
                    {label} ({count})
                  </button>
                ))}
              </div>
            )}

            {withWebsite > 0 && (
              <button
                onClick={() => { setShowAll(v => !v); setPage(0); }}
                className="text-[11px] text-muted-foreground hover:text-primary underline underline-offset-2 mb-4 block"
              >
                {showAll
                  ? (lang === 'fr' ? 'Masquer celles qui ont déjà un site' : 'Hide the ones that already have a website')
                  : (lang === 'fr' ? `Afficher aussi celles qui ont déjà un site (${withWebsite})` : `Also show the ones that already have a website (${withWebsite})`)}
              </button>
            )}

            <div id="scan-results-list" className="flex flex-col lg:grid lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="lg:col-span-2">
                {view === 'map' && position && (
                  <div className="h-[300px] sm:h-[500px]">
                    <BusinessMap businesses={filtered} center={position} onBusinessClick={handleSelectBusiness} />
                  </div>
                )}
                {view === 'list' && (
                  <>
                    <div className="space-y-3">
                      {pagedBusinesses.map((biz, i) => (
                        <BusinessHeroCard
                          key={biz.id}
                          business={biz}
                          lang={lang as 'fr' | 'en'}
                          rank={page * PAGE_SIZE + i}
                          featured={page === 0 && i === 0}
                          active={selected?.id === biz.id}
                          onConsult={() => handleSelectBusiness(biz)}
                        />
                      ))}
                    </div>

                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 mt-4">
                        <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(p => p - 1)} className="h-8 px-3 text-xs">
                          <ChevronLeft className="w-3.5 h-3.5 mr-1" /> {t('scan.previous')}
                        </Button>
                        <span className="text-xs text-muted-foreground font-mono">{page + 1}/{totalPages}</span>
                        <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="h-8 px-3 text-xs">
                          {t('scan.next')} <ChevronRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      </div>
                    )}
                  </>
                )}
                {filtered.length === 0 && (
                  <div className="glass rounded-lg p-8 sm:p-12 text-center">
                    <p className="text-sm text-muted-foreground">{t('scan.noResults')}</p>
                  </div>
                )}
              </div>

              <div className="lg:col-span-1" id="business-detail">
                <AnimatePresence mode="wait">
                  {selected ? (
                    <motion.div
                      key={selected.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="space-y-3 lg:sticky lg:top-20"
                    >
                      <div className="lg:hidden">
                        <Button size="sm" variant="ghost" className="h-8 px-2 text-xs text-muted-foreground" onClick={backToList}>
                          <ChevronLeft className="w-4 h-4 mr-1" /> {lang === 'fr' ? 'Retour à la liste' : 'Back to list'}
                        </Button>
                      </div>
                      <div className="relative overflow-hidden rounded-2xl border border-border/60">
                        <img
                          src={getBusinessVisual(selected.category).image}
                          alt={`${selected.name} — ${getBusinessVisual(selected.category).label[lang]}`}
                          className="w-full h-28 sm:h-32 object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-3 flex items-end justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-[9px] uppercase tracking-[0.18em] text-primary">{getBusinessVisual(selected.category).label[lang]}</p>
                            <h3 className="text-base sm:text-lg font-bold truncate">{selected.name}</h3>
                            <p className="text-[10px] text-muted-foreground truncate">{selected.address}</p>
                          </div>
                          <Button size="icon" variant="ghost" className="shrink-0 h-7 w-7 bg-background/50 backdrop-blur-md" onClick={() => setSelected(null)}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="glass rounded-lg p-3">
                        <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                          {getBusinessStory({ name: selected.name, category: selected.category, address: selected.address, hasWebsite: selected.hasWebsite }, lang as 'fr' | 'en')}
                        </p>
                      </div>

                      <div className="glass rounded-lg p-3 space-y-1.5 text-xs sm:text-sm">
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
                            <a href={selected.website.startsWith('http') ? selected.website : `https://${selected.website}`}
                              target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1 truncate">
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
                        {selected.lat && selected.lng && position && (
                          <a
                            href={`https://www.google.com/maps/dir/${position.lat},${position.lng}/${selected.lat},${selected.lng}`}
                            target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2 text-primary hover:underline pt-1"
                          >
                            <Navigation className="w-3 h-3 shrink-0" />
                            <span>{t('scan.directions')}</span>
                            <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                          </a>
                        )}
                      </div>

                      <div className="glass rounded-lg p-3 sm:p-4">
                        <div className="text-xs font-semibold mb-1">{t('scan.opportunityScore')}</div>
                        <div className="text-2xl sm:text-3xl font-mono font-black text-primary">{selected.opportunityScore}/10</div>
                      </div>

                      {!selected.hasWebsite && (
                        <div className="glass rounded-lg p-3 border-opportunity/30">
                          <div className="text-xs font-semibold text-opportunity mb-1">{t('scan.highOpportunity')}</div>
                          <p className="text-[10px] sm:text-xs text-muted-foreground">{t('scan.highOpportunityDesc')}</p>
                        </div>
                      )}

                      <BusinessAuditPanel
                        business={selected}
                        canAudit={canAudit}
                        lang={lang as 'fr' | 'en'}
                        onAuditGenerated={incrementAudit}
                        onUpgradeClick={() => setNag('audit')}
                      />

                      <Button size="sm" className="w-full h-9 text-xs" onClick={() => handleSaveLead(selected)} disabled={savingLead}>
                        {savingLead && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
                        {t('scan.save')}
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-lg p-6 text-center">
                      <p className="text-xs sm:text-sm text-muted-foreground">{t('scan.selectBusiness')}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {!userIsAdmin && userPlan === 'free' && (
              <div className="mt-6 glass rounded-lg p-4 text-center border-primary/20">
                <p className="text-xs sm:text-sm mb-2">
                  <ArrowUp className="w-3.5 h-3.5 inline mr-1" />
                  {t('scan.freePlanUsage')} : <strong>{scanCount}/{limits.maxScansTotal}</strong> {lang === 'fr' ? 'scans utilisés' : 'scans used'}.
                  {' '}{t('scan.upgradePremium')}
                </p>
                <Button size="sm" asChild>
                  <a href="/pricing">{t('scan.viewPlans')}</a>
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </div>

      <UpgradeNagDialog open={!!nag} onOpenChange={(open) => !open && setNag(null)} reason={nag || 'scan'} lang={lang as 'fr' | 'en'} />
    </AppLayout>
  );
}
