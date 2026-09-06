import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AppLayout } from '@/components/AppLayout';
import { BusinessCard } from '@/components/BusinessCard';
import { BusinessMap } from '@/components/BusinessMap';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import { Business } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Map, List, X, ExternalLink, Phone, Globe, Star, Loader2,
  ChevronLeft, ChevronRight, ArrowLeft, Navigation,
} from 'lucide-react';

const PAGE_SIZE = 5;

export default function ScanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [scanInfo, setScanInfo] = useState<{ lat: number; lng: number; radius: number; created_at: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'map' | 'list'>('list');
  const [selected, setSelected] = useState<Business | null>(null);
  const [savingLead, setSavingLead] = useState(false);
  const [page, setPage] = useState(0);

  useEffect(() => {
    if (!user || !id) return;

    const fetchScan = async () => {
      const [scanRes, bizRes] = await Promise.all([
        supabase.from('scans').select('lat, lng, radius, created_at').eq('id', id).single(),
        supabase.from('scan_businesses').select('*').eq('scan_id', id),
      ]);
      if (scanRes.data) setScanInfo(scanRes.data);
      if (bizRes.data) {
        setBusinesses(bizRes.data.map((b: any) => ({
          id: b.id, name: b.name, address: b.address, phone: b.phone || undefined,
          category: b.category, rating: b.rating || undefined, website: b.website || undefined,
          lat: b.lat, lng: b.lng, hasWebsite: b.has_website, opportunityScore: b.opportunity_score || undefined,
        })));
      }
      setLoading(false);
    };
    fetchScan();
  }, [user, id]);

  const sorted = useMemo(() => [...businesses].sort((a, b) => (b.opportunityScore || 0) - (a.opportunityScore || 0)), [businesses]);
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const pagedBusinesses = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const noWebsite = businesses.filter(b => !b.hasWebsite).length;
  const withWebsite = businesses.filter(b => b.hasWebsite).length;

  const handleSaveLead = async (biz: Business) => {
    if (!user) return;
    setSavingLead(true);
    try {
      const { error } = await supabase.from('leads').insert({
        user_id: user.id, business_name: biz.name, business_address: biz.address,
        business_phone: biz.phone || null, business_category: biz.category,
        business_rating: biz.rating || null, business_website: biz.website || null,
        has_website: biz.hasWebsite, opportunity_score: biz.opportunityScore || null,
        lat: biz.lat, lng: biz.lng, status: 'new',
      });
      if (error) throw error;
      toast({ title: t('scan.leadSaved'), description: `${biz.name} ${t('scan.leadSavedDesc')}` });
    } catch (err: any) {
      toast({ title: t('common.error'), description: err.message, variant: 'destructive' });
    } finally {
      setSavingLead(false);
    }
  };

  const handleSelectBusiness = (biz: Business) => {
    setSelected(biz);
    setTimeout(() => { document.getElementById('business-detail')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 100);
  };

  if (loading) {
    return <AppLayout><div className="max-w-7xl mx-auto px-4 py-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div></AppLayout>;
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="flex items-center gap-3 mb-4">
          <Button size="sm" variant="ghost" onClick={() => navigate('/dashboard')} className="h-8 px-2">
            <ArrowLeft className="w-4 h-4 mr-1" /> {t('common.back')}
          </Button>
          <div className="flex-1">
            <h1 className="text-lg sm:text-xl font-bold">{businesses.length} {t('scan.businesses')}</h1>
            {scanInfo && (
              <p className="text-xs text-muted-foreground">
                {scanInfo.radius} km · {new Date(scanInfo.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            )}
          </div>
          <Badge variant="outline" className="text-[10px] border-score-none/40 text-score-none">{noWebsite} {t('scan.noSite')}</Badge>
          <Badge variant="outline" className="text-[10px] border-score-good/40 text-score-good">{withWebsite} {t('scan.withSite')}</Badge>
          <div className="flex items-center gap-1">
            <Button size="sm" variant={view === 'list' ? 'secondary' : 'ghost'} onClick={() => setView('list')} className="h-7 w-7 p-0"><List className="w-3.5 h-3.5" /></Button>
            <Button size="sm" variant={view === 'map' ? 'secondary' : 'ghost'} onClick={() => setView('map')} className="h-7 w-7 p-0"><Map className="w-3.5 h-3.5" /></Button>
          </div>
        </div>

        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2">
            {view === 'map' && scanInfo && (
              <div className="h-[300px] sm:h-[500px]">
                <BusinessMap businesses={businesses} center={{ lat: scanInfo.lat, lng: scanInfo.lng }} onBusinessClick={handleSelectBusiness} />
              </div>
            )}
            {view === 'list' && (
              <>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
                  {pagedBusinesses.map(biz => (<BusinessCard key={biz.id} business={biz} onClick={() => handleSelectBusiness(biz)} />))}
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
          </div>

          <div className="lg:col-span-1" id="business-detail">
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

                  <div className="glass rounded-lg p-3 space-y-1.5 text-xs sm:text-sm">
                    {selected.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3 h-3 text-muted-foreground shrink-0" />
                        <a href={`tel:${selected.phone}`} className="hover:text-primary transition-colors truncate">{selected.phone}</a>
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
                    {selected.lat && selected.lng && scanInfo && (
                      <a href={`https://www.google.com/maps/dir/${scanInfo.lat},${scanInfo.lng}/${selected.lat},${selected.lng}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline pt-1">
                        <Navigation className="w-3 h-3 shrink-0" />
                        <span>{t('scan.directions')}</span>
                        <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                      </a>
                    )}
                  </div>

                  <div className="glass rounded-lg p-3 sm:p-4">
                    <div className="text-xs font-semibold mb-1">{t('scan.opportunityScore')}</div>
                    <div className="text-2xl sm:text-3xl font-mono font-black text-primary">{selected.opportunityScore || 0}/10</div>
                  </div>

                  {!selected.hasWebsite && (
                    <div className="glass rounded-lg p-3 border-opportunity/30">
                      <div className="text-xs font-semibold text-opportunity mb-1">{t('scan.highOpportunity')}</div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">{t('scan.highOpportunityDesc')}</p>
                    </div>
                  )}

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
      </div>
    </AppLayout>
  );
}
