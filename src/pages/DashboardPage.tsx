import { AppLayout } from '@/components/AppLayout';
import { motion } from 'framer-motion';
import { Radar, Globe, TrendingUp, Users, ArrowUpRight, Compass, ChevronLeft, ChevronRight, Clock, MapPin, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect, useRef } from 'react';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useToast } from '@/hooks/use-toast';

interface SavedScan {
  id: string;
  lat: number;
  lng: number;
  radius: number;
  business_count: number;
  created_at: string;
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [totalScans, setTotalScans] = useState(0);
  const [totalBusinesses, setTotalBusinesses] = useState(0);
  const [savedLeads, setSavedLeads] = useState(0);
  const [highOpportunity, setHighOpportunity] = useState(0);
  const [savedScans, setSavedScans] = useState<SavedScan[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const fetchData = async () => {
      const [scansRes, leadsRes, scansListRes] = await Promise.all([
        supabase.from('scans').select('id, business_count').eq('user_id', user.id),
        supabase.from('leads').select('id, opportunity_score').eq('user_id', user.id),
        supabase.from('scans').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(30),
      ]);
      const scans = scansRes.data || [];
      const leads = leadsRes.data || [];
      setTotalScans(scans.length);
      setTotalBusinesses(scans.reduce((sum, s) => sum + (s.business_count || 0), 0));
      setSavedLeads(leads.length);
      setHighOpportunity(leads.filter(l => (l.opportunity_score || 0) >= 7).length);
      setSavedScans(scansListRes.data || []);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const handleDeleteScan = async () => {
    if (!deleteId) return;
    await supabase.from('scans').delete().eq('id', deleteId);
    setSavedScans(prev => prev.filter(s => s.id !== deleteId));
    setTotalScans(prev => prev - 1);
    setDeleteId(null);
    toast({ title: t('common.success'), description: 'Scan supprimé' });
  };

  const scroll = (dir: 'left' | 'right') => {
    if (!carouselRef.current) return;
    carouselRef.current.scrollBy({ left: dir === 'left' ? -320 : 320, behavior: 'smooth' });
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Bonjour';
    if (h < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  const firstName = user?.email?.split('@')[0].split('.')[0] || '';

  const stats = [
    { label: 'Scans totaux', value: totalScans, icon: Radar, tint: 'primary' },
    { label: 'Entreprises trouvées', value: totalBusinesses, icon: Globe, tint: 'accent' },
    { label: 'Fortes opportunités', value: highOpportunity, icon: TrendingUp, tint: 'primary' },
    { label: 'Leads sauvegardés', value: savedLeads, icon: Users, tint: 'accent' },
  ];

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Hero header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-card via-card to-primary/5 p-5 sm:p-8 mb-6 sm:mb-10"
        >
          <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Tableau de bord</p>
              <h1 className="text-2xl sm:text-4xl font-bold leading-tight">
                {greeting()}{firstName && `, ${firstName.charAt(0).toUpperCase() + firstName.slice(1)}`}&nbsp;
              </h1>
              <p className="text-sm text-muted-foreground mt-2 max-w-md">
                Votre radar est actif. Continuez à explorer votre territoire et trouvez de nouveaux clients.
              </p>
            </div>
            <Link to="/scan">
              <Button size="lg" className="gap-2 shadow-lg shadow-primary/20">
                <Radar className="w-4 h-4" /> Nouveau scan
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-12">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card hover:border-primary/40 transition-all p-4 sm:p-5"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${s.tint === 'primary' ? 'bg-primary/10' : 'bg-accent/10'}`}>
                  <s.icon className={`w-5 h-5 ${s.tint === 'primary' ? 'text-primary' : 'text-accent'}`} />
                </div>
                {s.value > 0 && (
                  <span className="text-[10px] font-semibold text-primary flex items-center gap-0.5 bg-primary/10 rounded-full px-2 py-0.5">
                    +{s.value} <ArrowUpRight className="w-2.5 h-2.5" />
                  </span>
                )}
              </div>
              <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight">
                {loading ? <span className="opacity-30">—</span> : s.value}
              </div>
              <div className="text-[11px] sm:text-xs text-muted-foreground mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>

        <Link to="/suggestions" className="block mb-8 sm:mb-12">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="group flex items-center gap-4 rounded-2xl border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors p-4 sm:p-5"
          >
            <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm sm:text-base">Suggestions intelligentes</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Découvrez les secteurs les plus prometteurs pour vos prochains scans.</p>
            </div>
            <ArrowUpRight className="w-4 h-4 text-primary shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </motion.div>
        </Link>

        {/* Scan history horizontal carousel */}
        {savedScans.length > 0 ? (
          <section>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                  <Compass className="w-5 h-5 text-primary" /> Historique de scans
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Glissez pour parcourir vos {savedScans.length} derniers scans
                </p>
              </div>
              <div className="hidden sm:flex gap-1.5">
                <Button size="icon" variant="outline" onClick={() => scroll('left')} className="h-9 w-9 rounded-full">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="outline" onClick={() => scroll('right')} className="h-9 w-9 rounded-full">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="relative -mx-4 sm:mx-0">
              {/* Right edge fade */}
              <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background to-transparent z-10 hidden sm:block" />
              <div
                ref={carouselRef}
                className="flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth px-4 sm:px-0 pb-4"
                style={{ scrollbarWidth: 'none' }}
              >
                {savedScans.map((scan, i) => (
                  <motion.div
                    key={scan.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="snap-start shrink-0 w-[260px] sm:w-[280px]"
                  >
                    <Link to={`/scan-history/${scan.id}`}>
                      <div className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card hover:border-primary/50 transition-all p-4 h-full">
                        <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-primary/5 group-hover:bg-primary/10 transition-colors" />
                        <div className="relative">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <MapPin className="w-4 h-4 text-primary" />
                              </div>
                              <span className="text-sm font-semibold">{scan.radius} km</span>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteId(scan.id); }}
                            >
                              ×
                            </Button>
                          </div>
                          <div className="text-3xl font-bold font-mono tracking-tight">
                            {scan.business_count}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">entreprises détectées</div>
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-4 pt-3 border-t border-border/40">
                            <Clock className="w-3 h-3" />
                            {new Date(scan.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
                <div className="shrink-0 w-4 sm:w-0" />
              </div>
            </div>
          </section>
        ) : !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative overflow-hidden rounded-2xl border border-dashed border-border p-10 sm:p-16 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Compass className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">Prêt à explorer ?</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              Lancez votre premier scan et découvrez les entreprises autour de vous qui ont besoin de vos services.
            </p>
            <Link to="/scan">
              <Button size="lg" className="gap-2">
                <Radar className="w-4 h-4" /> Démarrer un scan
              </Button>
            </Link>
          </motion.div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Supprimer ce scan ?"
        description="Cette action est irréversible."
        onConfirm={handleDeleteScan}
      />
    </AppLayout>
  );
}
