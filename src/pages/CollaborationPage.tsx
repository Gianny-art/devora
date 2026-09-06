import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Users, Search, Check, X, Plus, MessageCircle, Loader2, Building2, Pencil, Trash2, UserMinus } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ConfirmDialog } from '@/components/ConfirmDialog';

type Profile = { id: string; full_name: string | null; email: string | null; avatar_url: string | null; company: string | null };
type CollabRequest = { id: string; sender_id: string; receiver_id: string; status: string; created_at: string; sender?: Profile; receiver?: Profile };
type Project = { id: string; name: string; description: string | null; created_by: string; created_at: string };

export default function CollaborationPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const [requests, setRequests] = useState<CollabRequest[]>([]);
  const [collaborators, setCollaborators] = useState<Profile[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [showNewProject, setShowNewProject] = useState(false);
  const [tab, setTab] = useState<'collabs' | 'projects'>('collabs');
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingProjectName, setEditingProjectName] = useState('');
  const [confirmAction, setConfirmAction] = useState<{ title: string; description: string; onConfirm: () => void } | null>(null);

  useEffect(() => {
    if (user) {
      fetchRequests();
      fetchProjects();
    }
  }, [user]);

  // Realtime collab requests
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('collab-requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'collaboration_requests' }, () => {
        fetchRequests();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const [requestProfiles, setRequestProfiles] = useState<Record<string, Profile>>({});

  const fetchRequests = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('collaboration_requests')
      .select('*')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false });
    if (data) {
      setRequests(data);
      // Fetch ALL related profiles (for pending + accepted)
      const allIds = [...new Set(data.flatMap(r => [r.sender_id, r.receiver_id]).filter(id => id !== user.id))];
      if (allIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email, avatar_url, company')
          .in('id', allIds);
        if (profiles) {
          const map: Record<string, Profile> = {};
          profiles.forEach(p => { map[p.id] = p; });
          setRequestProfiles(map);
          // Set collaborators from accepted requests
          const acceptedIds = data
            .filter(r => r.status === 'accepted')
            .map(r => r.sender_id === user.id ? r.receiver_id : r.sender_id);
          setCollaborators(profiles.filter(p => acceptedIds.includes(p.id)));
        }
      }
    }
  };

  const fetchProjects = async () => {
    if (!user) return;
    const { data: memberRows } = await supabase
      .from('project_members')
      .select('project_id')
      .eq('user_id', user.id);
    if (memberRows && memberRows.length > 0) {
      const ids = memberRows.map(r => r.project_id);
      const { data } = await supabase
        .from('projects')
        .select('*')
        .in('id', ids)
        .order('created_at', { ascending: false });
      if (data) setProjects(data);
    }
  };

  const searchUsers = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url, company')
      .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
      .neq('id', user!.id)
      .limit(5);
    setSearchResults(data || []);
    setSearching(false);
  };

  const sendRequest = async (receiverId: string) => {
    if (!user) return;
    const { error } = await supabase.from('collaboration_requests').insert({
      sender_id: user.id,
      receiver_id: receiverId,
    });
    if (error) {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
    } else {
      toast({ title: t('common.success'), description: t('collab.requestSent') });
      setSearchQuery('');
      setSearchResults([]);
      fetchRequests();
    }
  };

  const respondRequest = async (requestId: string, accept: boolean) => {
    const { error } = await supabase
      .from('collaboration_requests')
      .update({ status: accept ? 'accepted' : 'rejected' })
      .eq('id', requestId);
    if (!error) {
      toast({ title: accept ? t('collab.accepted') : t('collab.rejected') });
      fetchRequests();
    }
  };

  const createProject = async () => {
    if (!user || !newProjectName.trim()) return;
    const { data, error } = await supabase
      .from('projects')
      .insert({ name: newProjectName.trim(), created_by: user.id })
      .select()
      .single();
    if (error) {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
      return;
    }
    // Add creator as owner
    await supabase.from('project_members').insert({
      project_id: data.id,
      user_id: user.id,
      role: 'owner',
    });
    toast({ title: t('common.success'), description: t('collab.projectCreated') });
    setNewProjectName('');
    setShowNewProject(false);
    fetchProjects();
  };

  const renameProject = async (projectId: string) => {
    if (!editingProjectName.trim()) return;
    const { error } = await supabase.from('projects').update({ name: editingProjectName.trim() }).eq('id', projectId);
    if (!error) { toast({ title: t('collab.projectRenamed') }); setEditingProjectId(null); fetchProjects(); }
  };

  const deleteProject = (projectId: string) => {
    setConfirmAction({
      title: 'Supprimer le projet ?',
      description: 'Tous les messages, membres et données du projet seront supprimés définitivement.',
      onConfirm: async () => {
        await supabase.from('project_members').delete().eq('project_id', projectId);
        const { error } = await supabase.from('projects').delete().eq('id', projectId);
        if (!error) { toast({ title: t('collab.projectDeleted') }); fetchProjects(); }
        setConfirmAction(null);
      },
    });
  };

  const removeCollaborator = (collabUserId: string) => {
    if (!user) return;
    setConfirmAction({
      title: 'Retirer ce collaborateur ?',
      description: 'Cette personne ne pourra plus collaborer avec vous.',
      onConfirm: async () => {
        await supabase.from('collaboration_requests').delete().or(`and(sender_id.eq.${user.id},receiver_id.eq.${collabUserId}),and(sender_id.eq.${collabUserId},receiver_id.eq.${user.id})`);
        toast({ title: t('collab.collabRemoved') });
        fetchRequests();
        setConfirmAction(null);
      },
    });
  };

  if (!user) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">{t('scan.loginRequired')}</p>
        </div>
      </AppLayout>
    );
  }

  const pendingReceived = requests.filter(r => r.receiver_id === user.id && r.status === 'pending');

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 py-6 sm:py-10 space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" /> {t('collab.title')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t('collab.subtitle')}</p>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2">
          <Button variant={tab === 'collabs' ? 'default' : 'outline'} size="sm" onClick={() => setTab('collabs')} className="gap-1.5">
            <Users className="w-3.5 h-3.5" /> {t('collab.collaborators')}
            {pendingReceived.length > 0 && <Badge className="ml-1 h-4 w-4 p-0 flex items-center justify-center text-[9px]">{pendingReceived.length}</Badge>}
          </Button>
          <Button variant={tab === 'projects' ? 'default' : 'outline'} size="sm" onClick={() => setTab('projects')} className="gap-1.5">
            <Building2 className="w-3.5 h-3.5" /> {t('collab.projects')}
          </Button>
        </div>

        {tab === 'collabs' && (
          <>
            {/* Search users */}
            <section className="glass rounded-lg p-4 space-y-3">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Search className="w-4 h-4 text-primary" /> {t('collab.searchUsers')}
              </h2>
              <Input
                placeholder={t('collab.searchPlaceholder')}
                value={searchQuery}
                onChange={e => searchUsers(e.target.value)}
              />
              {searching && <p className="text-xs text-muted-foreground">{t('common.loading')}</p>}
              {searchResults.map(p => (
                <div key={p.id} className="flex items-center justify-between p-2 rounded-lg border border-border/50">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={p.avatar_url || undefined} />
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {(p.full_name || p.email || '?').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{p.full_name || p.email}</p>
                      {p.company && <p className="text-[10px] text-muted-foreground">{p.company}</p>}
                    </div>
                  </div>
                  <Button size="sm" className="h-7 text-xs gap-1" onClick={() => sendRequest(p.id)}
                    disabled={requests.some(r => (r.sender_id === user.id && r.receiver_id === p.id) || (r.receiver_id === user.id && r.sender_id === p.id))}>
                    <Plus className="w-3 h-3" /> {t('collab.invite')}
                  </Button>
                </div>
              ))}
            </section>

            {/* Pending requests */}
            {pendingReceived.length > 0 && (
              <section className="glass rounded-lg p-4 space-y-3">
                <h2 className="text-sm font-semibold">{t('collab.pendingRequests')}</h2>
                {pendingReceived.map(req => {
                  const senderProfile = requestProfiles[req.sender_id];
                  return (
                  <div key={req.id} className="flex items-center justify-between p-2 rounded-lg border border-primary/20 bg-primary/5">
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar className="w-7 h-7 shrink-0">
                        <AvatarImage src={senderProfile?.avatar_url || undefined} />
                        <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                          {(senderProfile?.full_name || senderProfile?.email || '?').slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{senderProfile?.full_name || senderProfile?.email || req.sender_id.slice(0, 8)}</p>
                        {senderProfile?.company && <p className="text-[10px] text-muted-foreground">{senderProfile.company}</p>}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button size="sm" className="h-7 text-xs gap-1" onClick={() => respondRequest(req.id, true)}>
                        <Check className="w-3 h-3" /> {t('collab.accept')}
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => respondRequest(req.id, false)}>
                        <X className="w-3 h-3" /> {t('collab.reject')}
                      </Button>
                    </div>
                  </div>
                  );
                })}
              </section>
            )}

            {/* Collaborators list */}
            <section className="glass rounded-lg p-4 space-y-3">
              <h2 className="text-sm font-semibold">{t('collab.myCollaborators')}</h2>
              {collaborators.length === 0 ? (
                <p className="text-xs text-muted-foreground">{t('collab.noCollaborators')}</p>
              ) : (
                collaborators.map(c => (
                  <div key={c.id} className="flex items-center gap-3 p-2 rounded-lg border border-border/50">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={c.avatar_url || undefined} />
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {(c.full_name || c.email || '?').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{c.full_name || c.email}</p>
                      {c.company && <p className="text-[10px] text-muted-foreground">{c.company}</p>}
                    </div>
                    <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive hover:text-destructive gap-1" onClick={() => removeCollaborator(c.id)}>
                      <UserMinus className="w-3 h-3" />
                    </Button>
                    <Badge variant="outline" className="text-[9px]">✓ {t('collab.connected')}</Badge>
                  </div>
                ))
              )}
            </section>
          </>
        )}

        {tab === 'projects' && (
          <>
            {/* New project */}
            <section className="glass rounded-lg p-4 space-y-3">
              {showNewProject ? (
                <div className="flex gap-2">
                  <Input placeholder={t('collab.projectName')} value={newProjectName} onChange={e => setNewProjectName(e.target.value)} />
                  <Button size="sm" onClick={createProject} disabled={!newProjectName.trim()}>{t('common.save')}</Button>
                  <Button size="sm" variant="outline" onClick={() => setShowNewProject(false)}>{t('common.cancel')}</Button>
                </div>
              ) : (
                <Button size="sm" className="gap-1.5" onClick={() => setShowNewProject(true)}>
                  <Plus className="w-3.5 h-3.5" /> {t('collab.newProject')}
                </Button>
              )}
            </section>

            {/* Projects list */}
            {projects.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{t('collab.noProjects')}</p>
              </div>
            ) : (
              projects.map(p => (
                <div key={p.id} className="glass rounded-lg p-4 space-y-2">
                  {editingProjectId === p.id ? (
                    <div className="flex gap-2">
                      <Input value={editingProjectName} onChange={e => setEditingProjectName(e.target.value)} className="text-sm h-8" />
                      <Button size="sm" className="h-8 text-xs" onClick={() => renameProject(p.id)}>{t('common.save')}</Button>
                      <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setEditingProjectId(null)}><X className="w-3 h-3" /></Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <Link to={`/project/${p.id}`} className="flex-1">
                        <h3 className="font-semibold text-sm hover:text-primary transition-colors">{p.name}</h3>
                      </Link>
                      {p.created_by === user.id && (
                        <div className="flex gap-1 shrink-0">
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setEditingProjectId(p.id); setEditingProjectName(p.name); }}>
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => deleteProject(p.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                  {p.description && <p className="text-xs text-muted-foreground">{p.description}</p>}
                  <div className="flex items-center gap-2">
                    <Link to={`/project/${p.id}`}>
                      <Badge variant="outline" className="text-[9px] cursor-pointer hover:bg-primary/10">
                        <MessageCircle className="w-2.5 h-2.5 mr-0.5" /> Chat
                      </Badge>
                    </Link>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(p.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>
      <ConfirmDialog
        open={!!confirmAction}
        onOpenChange={() => setConfirmAction(null)}
        title={confirmAction?.title || ''}
        description={confirmAction?.description || ''}
        onConfirm={() => confirmAction?.onConfirm()}
      />
    </AppLayout>
  );
}
