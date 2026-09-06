import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { getBusinessVisual, getNeedSummary, getNeedLevel } from '@/lib/business-visuals';
import {
  Users, Search, Trash2, ExternalLink, Globe, Phone, MapPin,
  Navigation, Star, X, ArrowRight, ChevronLeft,
} from 'lucide-react';

import { useToast } from '@/hooks/use-toast';

type Lead = {
  id: string;
  business_name: string;
  business_address: string | null;
  business_phone: string | null;
  business_category: string | null;
  business_rating: number | null;
  business_website: string | null;
  has_website: boolean;
  opportunity_score: number | null;
  status: string;
  notes: string;
  created_at: string;
  lat: number | null;
  lng: number | null;
};

const statusColors: Record<string, string> = {
  new: 'border-score-none/40 text-score-none',
  contacted: 'border-score-average/40 text-score-average',
  interested: 'border-primary/40 text-primary',
  proposal: 'border-accent/40 text-accent',
  closed: 'border-score-good/40 text-score-good',
  lost: 'border-score-bad/40 text-score-bad',
};

const pipelineStages = ['new', 'contacted', 'interested', 'proposal', 'closed', 'lost'];

const needTone: Record<string, string> = {
  critical: 'bg-score-none/15 text-score-none border-score-none/40',
  high: 'bg-score-bad/15 text-score-bad border-score-bad/40',
  medium: 'bg-score-average/15 text-score-average border-score-average/40',
  low: 'bg-score-good/15 text-score-good border-score-good/40',
};

const smoothScrollTo = (id: string) => {
  const el = document.getElementById(id);
  if (!el) return;
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 72, behavior: 'smooth' });
};

export default function LeadsPage() {
  const { user } = useAuth();
  const { t, lang } = useTranslation();
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchLeads = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('leads').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (!error && data) setLeads(data as Lead[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchLeads();
  }, [user]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('leads').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    if (!error) {
      setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
      toast({ title: t('leads.statusUpdated') });
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('leads').delete().eq('id', deleteId);
    if (!error) {
      setLeads(prev => prev.filter(l => l.id !== deleteId));
      if (selectedLead?.id === deleteId) setSelectedLead(null);
      toast({ title: t('leads.deleted') });
    }
    setDeleteId(null);
  };

  const selectLead = (lead: Lead) => {
    setSelectedLead(lead);
    setTimeout(() => smoothScrollTo('lead-detail'), 120);
  };

  const filtered = leads
    .filter(l =>
      l.business_name.toLowerCase().includes(search.toLowerCase()) ||
      (l.business_category || '').toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => (b.opportunity_score || 0) - (a.opportunity_score || 0));

  const stageCounts = pipelineStages.reduce((acc, s) => {
    acc[s] = leads.filter(l => l.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  if (!user) {
    return (
      <AppLayout>
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground">{t('leads.loginRequired')}</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">{t('leads.title')}</h1>
            <p className="text-sm text-muted-foreground">{t('leads.subtitle')} ({leads.length} {t('leads.total')})</p>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('leads.search')} className="pl-9" />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          {pipelineStages.map(stage => (
            <div key={stage} className="glass rounded-lg p-3 text-center">
              <Badge variant="outline" className={`text-[10px] mb-2 ${statusColors[stage]}`}>{stage}</Badge>
              <div className="text-2xl font-mono font-bold">{stageCounts[stage]}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2" id="leads-list">
            {loading ? (
              <div className="glass rounded-lg p-12 text-center">
                <p className="text-muted-foreground">{t('leads.loading')}</p>
              </div>
            ) : filtered.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-lg p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-primary/60" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{t('leads.noLeads')}</h3>
                <p className="text-sm text-muted-foreground">{t('leads.noLeadsDesc')}</p>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {filtered.map((lead, i) => {
                  const visual = getBusinessVisual(lead.business_category);
                  const need = getNeedLevel(!!lead.business_website, lead.opportunity_score);
                  const summary = getNeedSummary({
                    name: lead.business_name,
                    category: lead.business_category,
                    hasWebsite: !!lead.business_website,
                    opportunityScore: lead.opportunity_score,
                  }, lang as 'fr' | 'en');
                  const featured = i === 0;
                  return (
                    <motion.div key={lead.id}
                      className={`group relative overflow-hidden rounded-2xl border bg-card/60 backdrop-blur-xl cursor-pointer transition-all ${selectedLead?.id === lead.id ? 'border-primary/60' : 'border-border/50 hover:border-primary/30'}`}
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.03, 0.3) }}
                      onClick={() => selectLead(lead)}
                    >
                      {featured ? (
                        <div className="relative h-[210px] sm:h-[260px]">
                          <img src={visual.image} alt={`${lead.business_name} — ${visual.label[lang as 'fr' | 'en']}`} loading="lazy"
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/75 to-card/10" />
                          <div className="absolute top-3 right-3 flex items-center gap-2">
                            <select value={lead.status} onChange={e => { e.stopPropagation(); updateStatus(lead.id, e.target.value); }}
                              onClick={e => e.stopPropagation()}
                              className="text-xs bg-background/60 backdrop-blur-md border border-border/60 rounded-full px-2 py-1">
                              {pipelineStages.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <Button size="icon" variant="ghost" className="h-8 w-8 bg-background/60 backdrop-blur-md" onClick={(e) => { e.stopPropagation(); setDeleteId(lead.id); }}>
                              <Trash2 className="w-3.5 h-3.5 text-destructive" />
                            </Button>
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
                            <div className="flex items-center gap-2 mb-1.5">
                              <Badge variant="outline" className={`text-[10px] backdrop-blur-md ${needTone[need.tone]}`}>{need[lang as 'fr' | 'en']}</Badge>
                              <Badge variant="outline" className={`text-[10px] ${statusColors[lead.status]}`}>{lead.status}</Badge>
                              {lead.opportunity_score && <span className="text-xs font-mono font-bold text-primary">{lead.opportunity_score}/10</span>}
                            </div>
                            <p className="text-[10px] uppercase tracking-[0.2em] text-primary mb-1">{visual.label[lang as 'fr' | 'en']}</p>
                            <h3 className="text-xl sm:text-3xl font-bold leading-tight">{lead.business_name}</h3>
                            <p className="text-xs text-muted-foreground mt-1.5 max-w-xl">{summary}</p>
                            <div className="flex flex-wrap items-center gap-3 mt-3">
                              <Button size="sm" className="rounded-full gap-1.5" onClick={(e) => { e.stopPropagation(); selectLead(lead); }}>
                                {lang === 'fr' ? 'Consulter' : 'Consult'} <ArrowRight className="w-3.5 h-3.5" />
                              </Button>
                              {lead.business_address && (
                                <span className="flex items-center gap-1 text-[11px] text-muted-foreground max-w-[200px] truncate"><MapPin className="w-3 h-3 shrink-0" />{lead.business_address}</span>
                              )}
                              {lead.business_phone && (
                                <a href={`tel:${lead.business_phone}`} className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary" onClick={e => e.stopPropagation()}>
                                  <Phone className="w-3 h-3" />{lead.business_phone}
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-3 items-stretch">
                          <div className="relative w-24 sm:w-32 shrink-0 overflow-hidden">
                            <img src={visual.image} alt={`${lead.business_name} — ${visual.label[lang as 'fr' | 'en']}`} loading="lazy"
                              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card/40" />
                          </div>
                          <div className="flex-1 min-w-0 py-3 pr-3 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <h3 className="font-semibold text-sm sm:text-base truncate group-hover:text-primary transition-colors">
                                  <span className="text-muted-foreground font-mono mr-1.5">{i + 1}.</span>{lead.business_name}
                                </h3>
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">{visual.label[lang as 'fr' | 'en']}</p>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <select value={lead.status} onChange={e => { e.stopPropagation(); updateStatus(lead.id, e.target.value); }}
                                  onClick={e => e.stopPropagation()}
                                  className="text-xs bg-secondary border border-border rounded-full px-2 py-1">
                                  {pipelineStages.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setDeleteId(lead.id); }}>
                                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                                </Button>
                              </div>
                            </div>
                            <p className="text-[11px] text-muted-foreground line-clamp-2">{summary}</p>
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <Badge variant="outline" className={`text-[9px] ${needTone[need.tone]}`}>{need[lang as 'fr' | 'en']}</Badge>
                                {lead.opportunity_score && <span className="text-[11px] font-mono font-bold text-primary">{lead.opportunity_score}/10</span>}
                                {lead.business_website ? (
                                  <a href={lead.business_website.startsWith('http') ? lead.business_website : `https://${lead.business_website}`}
                                    target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline" onClick={e => e.stopPropagation()}>
                                    <Globe className="w-3 h-3" /><ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                ) : (
                                  <span className="flex items-center gap-1 text-[10px] text-opportunity"><Globe className="w-3 h-3" />{t('leads.noSite')}</span>
                                )}
                              </div>
                              <Button size="sm" variant="ghost" className="h-7 rounded-full text-[11px] text-primary hover:bg-primary/10 gap-1"
                                onClick={(e) => { e.stopPropagation(); selectLead(lead); }}>
                                {lang === 'fr' ? 'Consulter' : 'Consult'} <ArrowRight className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}

          </div>

          {/* Detail panel */}
          <div className="lg:col-span-1" id="lead-detail">
            <AnimatePresence mode="wait">
              {selectedLead ? (
                <motion.div key={selectedLead.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="space-y-3 lg:sticky lg:top-20">
                  <div className="lg:hidden">
                    <Button size="sm" variant="ghost" className="h-8 px-2 text-xs text-muted-foreground" onClick={() => smoothScrollTo('leads-list')}>
                      <ChevronLeft className="w-4 h-4 mr-1" /> {lang === 'fr' ? 'Retour à la liste' : 'Back to list'}
                    </Button>
                  </div>
                  <div className="relative overflow-hidden rounded-2xl border border-border/60">
                    <img
                      src={getBusinessVisual(selectedLead.business_category).image}
                      alt={`${selectedLead.business_name} — ${getBusinessVisual(selectedLead.business_category).label[lang as 'fr' | 'en']}`}
                      className="w-full h-28 sm:h-32 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3 flex items-end justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[9px] uppercase tracking-[0.18em] text-primary">{getBusinessVisual(selectedLead.business_category).label[lang as 'fr' | 'en']}</p>
                        <h3 className="text-base sm:text-lg font-bold truncate">{selectedLead.business_name}</h3>
                        <p className="text-[10px] text-muted-foreground truncate">{selectedLead.business_address}</p>
                      </div>
                      <Button size="icon" variant="ghost" className="shrink-0 h-7 w-7 bg-background/50 backdrop-blur-md" onClick={() => setSelectedLead(null)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="glass rounded-lg p-3 space-y-1.5 text-xs sm:text-sm">
                    {selectedLead.business_phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3 h-3 text-muted-foreground shrink-0" />
                        <a href={`tel:${selectedLead.business_phone}`} className="hover:text-primary">{selectedLead.business_phone}</a>
                      </div>
                    )}
                    {selectedLead.business_website ? (
                      <div className="flex items-center gap-2">
                        <Globe className="w-3 h-3 text-muted-foreground shrink-0" />
                        <a href={selectedLead.business_website.startsWith('http') ? selectedLead.business_website : `https://${selectedLead.business_website}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1 truncate">
                          <span className="truncate">{selectedLead.business_website}</span>
                          <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                        </a>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Globe className="w-3 h-3 text-muted-foreground shrink-0" />
                        <Badge variant="outline" className="text-[10px] border-opportunity/40 text-opportunity">{t('scan.noWebsiteBadge')}</Badge>
                      </div>
                    )}
                    {selectedLead.business_rating && (
                      <div className="flex items-center gap-2">
                        <Star className="w-3 h-3 text-warning shrink-0" />
                        <span>{selectedLead.business_rating}/5</span>
                      </div>
                    )}
                    {selectedLead.lat && selectedLead.lng && (
                      <a href={`https://www.google.com/maps/search/?api=1&query=${selectedLead.lat},${selectedLead.lng}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline pt-1">
                        <Navigation className="w-3 h-3 shrink-0" />
                        <span>{t('scan.directions')}</span>
                        <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                      </a>
                    )}
                  </div>

                  {selectedLead.opportunity_score && (
                    <div className="glass rounded-lg p-3 sm:p-4">
                      <div className="text-xs font-semibold mb-1">{t('scan.opportunityScore')}</div>
                      <div className="text-2xl sm:text-3xl font-mono font-black text-primary">{selectedLead.opportunity_score}/10</div>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <select value={selectedLead.status} onChange={e => updateStatus(selectedLead.id, e.target.value)}
                      className="flex-1 text-xs bg-secondary border border-border rounded-md px-2 py-2">
                      {pipelineStages.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <Button size="icon" variant="outline" className="h-9 w-9 shrink-0" onClick={() => setDeleteId(selectedLead.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-lg p-6 text-center">
                  <p className="text-xs sm:text-sm text-muted-foreground">{t('leads.selectLead') || 'Sélectionnez un lead pour voir les détails'}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title={lang === 'fr' ? 'Supprimer ce lead ?' : 'Delete this lead?'}
        description={lang === 'fr' ? 'Cette action est irréversible.' : 'This action is irreversible.'}
        onConfirm={confirmDelete}
      />
    </AppLayout>
  );
}
