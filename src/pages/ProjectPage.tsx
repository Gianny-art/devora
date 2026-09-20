import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AppLayout } from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { BusinessHeroCard } from '@/components/BusinessHeroCard';
import { BusinessAuditPanel } from '@/components/BusinessAuditPanel';
import { UpgradeNagDialog } from '@/components/UpgradeNagDialog';
import { getBusinessStory } from '@/lib/business-visuals';
import { useUsageLimits } from '@/hooks/useUsageLimits';
import { Business } from '@/types';
import {
  Send, Users, Building2, Plus, UserPlus, Loader2, Trash2,
  X, Phone, Mail, Globe, Star, MapPin, Navigation, ExternalLink,
} from 'lucide-react';
import { ProjectChat } from '@/components/ProjectChat';
import { ConfirmDialog } from '@/components/ConfirmDialog';

type Member = { id: string; user_id: string; role: string };

type LeadRow = {
  id: string; business_name: string; business_address: string | null;
  business_city: string | null; business_district: string | null;
  business_phone: string | null; business_email: string | null; business_category: string | null;
  business_rating: number | null; business_website: string | null; has_website: boolean;
  opportunity_score: number | null; lat: number | null; lng: number | null;
};
type ProjectBiz = { id: string; lead_id: string; lead?: LeadRow };

const leadToBusiness = (lead: LeadRow): Business => ({
  id: lead.id,
  name: lead.business_name,
  address: lead.business_address || '',
  city: lead.business_city || undefined,
  district: lead.business_district || undefined,
  phone: lead.business_phone || undefined,
  email: lead.business_email || undefined,
  category: lead.business_category || '',
  rating: lead.business_rating || undefined,
  website: lead.business_website || undefined,
  lat: lead.lat || 0,
  lng: lead.lng || 0,
  hasWebsite: lead.has_website,
  opportunityScore: lead.opportunity_score || undefined,
});

export default function ProjectPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { t, lang } = useTranslation();
  const { toast } = useToast();
  const [project, setProject] = useState<{ name: string; description: string | null; created_by: string } | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [businesses, setBusinesses] = useState<ProjectBiz[]>([]);
  const [tab, setTab] = useState<'chat' | 'businesses' | 'members'>('chat');
  const [addingMember, setAddingMember] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [memberResults, setMemberResults] = useState<any[]>([]);
  const [userLeads, setUserLeads] = useState<any[]>([]);
  const [memberProfiles, setMemberProfiles] = useState<Record<string, { full_name: string | null; email: string | null; avatar_url: string | null }>>({});
  const [confirmAction, setConfirmAction] = useState<{ title: string; description: string; onConfirm: () => void } | null>(null);
  const [selectedBiz, setSelectedBiz] = useState<{ business: Business; projectBizId: string } | null>(null);
  const [userPlan, setUserPlan] = useState('free');
  const [nag, setNag] = useState(false);
  const { canAudit, incrementAudit } = useUsageLimits(userPlan);

  useEffect(() => {
    if (!user) return;
    supabase.functions.invoke('check-subscription').then(({ data }) => {
      if (data?.plan) setUserPlan(data.plan);
    }).catch(() => {});
  }, [user]);

  useEffect(() => {
    if (user && projectId) fetchAll();
  }, [user, projectId]);

  const fetchAll = async () => {
    const { data: proj } = await supabase.from('projects').select('name, description, created_by').eq('id', projectId!).single();
    if (proj) setProject(proj);

    const { data: mems } = await supabase.from('project_members').select('id, user_id, role').eq('project_id', projectId!);
    if (mems) {
      setMembers(mems);
      const ids = mems.map(m => m.user_id);
      const { data: profiles } = await supabase.from('profiles').select('id, full_name, email, avatar_url').in('id', ids);
      if (profiles) {
        const map: Record<string, any> = {};
        profiles.forEach(p => { map[p.id] = p; });
        setMemberProfiles(map);
      }
    }

    const { data: bizs } = await supabase.from('project_businesses').select('id, lead_id').eq('project_id', projectId!) as any;
    if (bizs && bizs.length > 0) {
      const leadIds = bizs.map((b: any) => b.lead_id);
      const { data: leads } = await supabase.from('leads').select(
        'id, business_name, business_address, business_city, business_district, business_phone, business_email, business_category, business_rating, business_website, has_website, opportunity_score, lat, lng'
      ).in('id', leadIds);
      const enriched = bizs.map((b: any) => ({ ...b, lead: leads?.find((l: any) => l.id === b.lead_id) }));
      setBusinesses(enriched);
    } else {
      setBusinesses([]);
    }

    const { data: myLeads } = await supabase.from('leads').select('id, business_name, business_category').eq('user_id', user!.id).limit(50);
    if (myLeads) setUserLeads(myLeads);
  };

  const searchMembers = async (q: string) => {
    setMemberSearch(q);
    if (q.length < 2) { setMemberResults([]); return; }
    const { data: reqs } = await supabase.from('collaboration_requests').select('sender_id, receiver_id').eq('status', 'accepted').or(`sender_id.eq.${user!.id},receiver_id.eq.${user!.id}`);
    if (!reqs) return;
    const collabIds = reqs.map(r => r.sender_id === user!.id ? r.receiver_id : r.sender_id);
    const existingMemberIds = members.map(m => m.user_id);
    const eligibleIds = collabIds.filter(id => !existingMemberIds.includes(id));
    if (eligibleIds.length === 0) { setMemberResults([]); return; }
    const { data } = await supabase.from('profiles').select('id, full_name, email, avatar_url').in('id', eligibleIds).or(`full_name.ilike.%${q}%,email.ilike.%${q}%`).limit(5);
    setMemberResults(data || []);
  };

  const addMember = async (userId: string) => {
    if (!projectId) return;
    const { error } = await supabase.from('project_members').insert({ project_id: projectId, user_id: userId, role: 'member' });
    if (!error) { toast({ title: t('common.success'), description: t('collab.memberAdded') }); setMemberSearch(''); setMemberResults([]); setAddingMember(false); fetchAll(); }
  };

  const addBusiness = async (leadId: string) => {
    if (!projectId || !user) return;
    const { error } = await supabase.from('project_businesses').insert({ project_id: projectId, lead_id: leadId, added_by: user.id });
    if (!error) { toast({ title: t('common.success'), description: t('collab.businessAdded') }); fetchAll(); }
  };

  const removeBusiness = (projectBizId: string) => {
    setConfirmAction({
      title: lang === 'fr' ? 'Retirer cette entreprise ?' : 'Remove this business?',
      description: lang === 'fr' ? 'Elle sera retirée du projet pour toute l’équipe.' : 'It will be removed from the project for the whole team.',
      onConfirm: async () => {
        const { error } = await supabase.from('project_businesses').delete().eq('id', projectBizId);
        if (!error) {
          toast({ title: lang === 'fr' ? 'Entreprise retirée' : 'Business removed' });
          if (selectedBiz?.projectBizId === projectBizId) setSelectedBiz(null);
          fetchAll();
        }
        setConfirmAction(null);
      },
    });
  };

  const removeMember = (memberId: string) => {
    setConfirmAction({
      title: lang === 'fr' ? 'Retirer ce membre ?' : 'Remove this member?',
      description: lang === 'fr' ? 'Ce membre sera retiré du projet.' : 'This member will be removed from the project.',
      onConfirm: async () => {
        const { error } = await supabase.from('project_members').delete().eq('id', memberId);
        if (!error) { toast({ title: t('collab.memberRemoved') }); fetchAll(); }
        setConfirmAction(null);
      },
    });
  };

  if (!user || !project) {
    return <AppLayout><div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div></AppLayout>;
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        <div>
          <h1 className="text-xl font-bold">{project.name}</h1>
          {project.description && <p className="text-xs text-muted-foreground">{project.description}</p>}
        </div>

        <div className="flex gap-2 flex-wrap">
          {(['chat', 'businesses', 'members'] as const).map(t2 => (
            <Button key={t2} variant={tab === t2 ? 'default' : 'outline'} size="sm" onClick={() => setTab(t2)} className="text-xs capitalize gap-1">
              {t2 === 'chat' && <Send className="w-3 h-3" />}
              {t2 === 'businesses' && <Building2 className="w-3 h-3" />}
              {t2 === 'members' && <Users className="w-3 h-3" />}
              {t(`collab.tab_${t2}`)}
            </Button>
          ))}
        </div>

        {tab === 'chat' && (
          <ProjectChat projectId={projectId!} memberProfiles={memberProfiles} members={members} />
        )}

        {tab === 'businesses' && (
          <div className="grid lg:grid-cols-2 gap-4 items-start">
            <div className="space-y-3">
              {businesses.length === 0 && (
                <div className="glass rounded-lg p-6 text-center text-xs text-muted-foreground">
                  {lang === 'fr' ? 'Aucune entreprise partagée dans ce projet pour le moment.' : 'No business shared in this project yet.'}
                </div>
              )}
              {businesses.filter(b => b.lead).map((b, i) => (
                <div key={b.id} className="relative">
                  <BusinessHeroCard
                    business={leadToBusiness(b.lead!)}
                    lang={lang as 'fr' | 'en'}
                    rank={i}
                    active={selectedBiz?.projectBizId === b.id}
                    onConsult={() => setSelectedBiz({ business: leadToBusiness(b.lead!), projectBizId: b.id })}
                  />
                  <Button
                    size="icon" variant="ghost"
                    className="absolute top-2 right-2 h-7 w-7 bg-background/70 backdrop-blur-md text-destructive hover:text-destructive z-10"
                    onClick={(e) => { e.stopPropagation(); removeBusiness(b.id); }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}

              <div className="glass rounded-lg p-3 space-y-2">
                <h3 className="text-xs font-semibold">{t('collab.addBusiness')}</h3>
                {userLeads.filter(l => !businesses.some(b => b.lead_id === l.id)).slice(0, 10).map(lead => (
                  <div key={lead.id} className="flex items-center justify-between p-1.5 rounded border border-border/50">
                    <span className="text-xs">{lead.business_name}</span>
                    <Button size="sm" className="h-6 text-[10px]" onClick={() => addBusiness(lead.id)}>
                      <Plus className="w-2.5 h-2.5 mr-0.5" /> {t('common.save')}
                    </Button>
                  </div>
                ))}
                {userLeads.filter(l => !businesses.some(b => b.lead_id === l.id)).length === 0 && (
                  <p className="text-[11px] text-muted-foreground">{lang === 'fr' ? 'Tous vos leads sont déjà partagés ici.' : 'All your leads are already shared here.'}</p>
                )}
              </div>
            </div>

            <div id="project-business-detail">
              <AnimatePresence mode="wait">
                {selectedBiz ? (
                  <motion.div key={selectedBiz.projectBizId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="space-y-3 lg:sticky lg:top-20">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-base sm:text-lg font-bold truncate">{selectedBiz.business.name}</h3>
                        <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{selectedBiz.business.category} · {selectedBiz.business.address}</p>
                      </div>
                      <Button size="icon" variant="ghost" className="shrink-0 h-7 w-7" onClick={() => setSelectedBiz(null)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="glass rounded-lg p-3">
                      <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                        {getBusinessStory({ name: selectedBiz.business.name, category: selectedBiz.business.category, address: selectedBiz.business.address, hasWebsite: selectedBiz.business.hasWebsite }, lang as 'fr' | 'en')}
                      </p>
                    </div>

                    <div className="glass rounded-lg p-3 space-y-1.5 text-xs sm:text-sm">
                      {(selectedBiz.business.district || selectedBiz.business.city) && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                          <span className="truncate">{[selectedBiz.business.district, selectedBiz.business.city].filter(Boolean).join(', ')}</span>
                        </div>
                      )}
                      {selectedBiz.business.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3 h-3 text-muted-foreground shrink-0" />
                          <a href={`tel:${selectedBiz.business.phone}`} className="hover:text-primary transition-colors truncate">{selectedBiz.business.phone}</a>
                        </div>
                      )}
                      {selectedBiz.business.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-3 h-3 text-muted-foreground shrink-0" />
                          <a href={`mailto:${selectedBiz.business.email}`} className="hover:text-primary transition-colors truncate">{selectedBiz.business.email}</a>
                        </div>
                      )}
                      {selectedBiz.business.website ? (
                        <div className="flex items-center gap-2">
                          <Globe className="w-3 h-3 text-muted-foreground shrink-0" />
                          <a href={selectedBiz.business.website.startsWith('http') ? selectedBiz.business.website : `https://${selectedBiz.business.website}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1 truncate">
                            <span className="truncate">{selectedBiz.business.website}</span>
                            <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                          </a>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Globe className="w-3 h-3 text-muted-foreground shrink-0" />
                          <Badge variant="outline" className="text-[10px] border-opportunity/40 text-opportunity">{t('scan.noWebsiteBadge')}</Badge>
                        </div>
                      )}
                      {selectedBiz.business.rating && (
                        <div className="flex items-center gap-2">
                          <Star className="w-3 h-3 text-warning shrink-0" />
                          <span>{selectedBiz.business.rating}/5</span>
                        </div>
                      )}
                      {!!selectedBiz.business.lat && !!selectedBiz.business.lng && (
                        <a href={`https://www.google.com/maps/search/?api=1&query=${selectedBiz.business.lat},${selectedBiz.business.lng}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline pt-1">
                          <Navigation className="w-3 h-3 shrink-0" />
                          <span>{t('scan.directions')}</span>
                          <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                        </a>
                      )}
                    </div>

                    {selectedBiz.business.opportunityScore !== undefined && (
                      <div className="glass rounded-lg p-3 sm:p-4">
                        <div className="text-xs font-semibold mb-1">{t('scan.opportunityScore')}</div>
                        <div className="text-2xl sm:text-3xl font-mono font-black text-primary">{selectedBiz.business.opportunityScore}/10</div>
                      </div>
                    )}

                    <BusinessAuditPanel
                      business={selectedBiz.business}
                      canAudit={canAudit}
                      lang={lang as 'fr' | 'en'}
                      onAuditGenerated={incrementAudit}
                      onUpgradeClick={() => setNag(true)}
                    />
                  </motion.div>
                ) : (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-lg p-6 text-center">
                    <p className="text-xs sm:text-sm text-muted-foreground">{t('scan.selectBusiness')}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {tab === 'members' && (
          <div className="space-y-3">
            {members.map(m => {
              const p = memberProfiles[m.user_id];
              return (
                <div key={m.id} className="glass rounded-lg p-3 flex items-center gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={p?.avatar_url || undefined} />
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {(p?.full_name || p?.email || '?').slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{p?.full_name || p?.email || m.user_id.slice(0, 8)}</p>
                  </div>
                  <Badge variant="outline" className="text-[9px]">{m.role}</Badge>
                  {project?.created_by === user?.id && m.role !== 'owner' && (
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => removeMember(m.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              );
            })}
            {addingMember ? (
              <div className="glass rounded-lg p-3 space-y-2">
                <Input placeholder={t('collab.searchPlaceholder')} value={memberSearch} onChange={e => searchMembers(e.target.value)} className="text-xs h-8" />
                {memberResults.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-1.5 rounded border border-border/50">
                    <span className="text-xs">{p.full_name || p.email}</span>
                    <Button size="sm" className="h-6 text-[10px]" onClick={() => addMember(p.id)}>
                      <Plus className="w-2.5 h-2.5" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setAddingMember(true)}>
                <UserPlus className="w-3.5 h-3.5" /> {t('collab.addMember')}
              </Button>
            )}
          </div>
        )}
      </div>
      <ConfirmDialog
        open={!!confirmAction}
        onOpenChange={() => setConfirmAction(null)}
        title={confirmAction?.title || ''}
        description={confirmAction?.description || ''}
        onConfirm={() => confirmAction?.onConfirm()}
      />
      <UpgradeNagDialog open={nag} onOpenChange={setNag} reason="audit" lang={lang as 'fr' | 'en'} />
    </AppLayout>
  );
}
