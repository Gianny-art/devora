import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import { supabase } from '@/integrations/supabase/client';
import { isPremium as checkIsPremium } from '@/lib/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Camera, Save, Loader2, User, Zap, Radar, Users, PhoneCall, Building2, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

type Activity = { id: string; business_name: string; status: string; created_at: string };

export default function ProfilePage() {
  const { user } = useAuth();
  const { t, lang } = useTranslation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState({
    full_name: '', company: '', phone: '', avatar_url: '', plan: 'free', created_at: '',
  });
  const [stats, setStats] = useState({ scans: 0, businesses: 0, leadsTotal: 0, leadsContacted: 0 });
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchStats();
    }
  }, [user]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('full_name, company, phone, avatar_url, plan, created_at')
      .eq('id', user!.id)
      .single();
    if (data) {
      setProfile({
        full_name: data.full_name || '',
        company: data.company || '',
        phone: data.phone || '',
        avatar_url: data.avatar_url || '',
        plan: data.plan || 'free',
        created_at: data.created_at || '',
      });
    }
  };

  const fetchStats = async () => {
    const [scansRes, leadsRes, recentRes] = await Promise.all([
      supabase.from('scans').select('id, business_count').eq('user_id', user!.id),
      supabase.from('leads').select('id, status').eq('user_id', user!.id),
      supabase.from('leads').select('id, business_name, status, created_at').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(5),
    ]);
    const scans = scansRes.data || [];
    const leads = leadsRes.data || [];
    setStats({
      scans: scans.length,
      businesses: scans.reduce((sum, s) => sum + (s.business_count || 0), 0),
      leadsTotal: leads.length,
      leadsContacted: leads.filter(l => l.status !== 'new').length,
    });
    setRecentActivity(recentRes.data || []);
  };

  const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
      const url = `${publicUrl}?t=${Date.now()}`;
      setProfile(p => ({ ...p, avatar_url: url }));
      await supabase.from('profiles').update({ avatar_url: url }).eq('id', user.id);
      toast({ title: t('common.success'), description: lang === 'fr' ? 'Logo mis à jour' : 'Logo updated' });
    } catch (err: any) {
      toast({ title: t('common.error'), description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const saveProfile = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('profiles').update({
        full_name: profile.full_name,
        company: profile.company,
        phone: profile.phone,
      }).eq('id', user.id);
      if (error) throw error;
      toast({ title: t('common.success'), description: t('profile.saved') });
    } catch (err: any) {
      toast({ title: t('common.error'), description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
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

  const isPremiumUser = checkIsPremium(profile.plan, user.email);
  const initials = (profile.company || profile.full_name)
    ? (profile.company || profile.full_name).split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user.email?.slice(0, 2).toUpperCase() || 'U';
  const memberSince = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { month: 'long', year: 'numeric' })
    : null;

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 py-6 sm:py-10 space-y-6">
        {/* Header card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
            <div className="relative shrink-0">
              <Avatar className="w-20 h-20 sm:w-24 sm:h-24 border-2 border-primary/30 rounded-2xl">
                <AvatarImage src={profile.avatar_url} className="object-cover" />
                <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary rounded-2xl">{initials}</AvatarFallback>
              </Avatar>
              <label className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary flex items-center justify-center cursor-pointer hover:bg-primary/80 transition-colors">
                {uploading ? <Loader2 className="w-3.5 h-3.5 text-primary-foreground animate-spin" /> : <Camera className="w-3.5 h-3.5 text-primary-foreground" />}
                <input type="file" accept="image/*" className="hidden" onChange={uploadAvatar} disabled={uploading} />
              </label>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
                <h1 className="text-xl sm:text-2xl font-bold truncate">{profile.full_name || (lang === 'fr' ? 'Sans nom' : 'No name')}</h1>
                {isPremiumUser && (
                  <Badge className="self-center sm:self-auto bg-primary/15 text-primary border-primary/30 gap-1 w-fit">
                    <Zap className="w-3 h-3" /> Premium
                  </Badge>
                )}
              </div>
              {profile.company && <p className="text-sm text-muted-foreground flex items-center justify-center sm:justify-start gap-1 mt-0.5"><Building2 className="w-3.5 h-3.5" /> {profile.company}</p>}
              <p className="text-xs text-muted-foreground mt-1">{user.email}</p>
              {memberSince && <p className="text-[11px] text-muted-foreground/70 mt-0.5">{lang === 'fr' ? `Membre depuis ${memberSince}` : `Member since ${memberSince}`}</p>}
              {!isPremiumUser && (
                <Button size="sm" variant="outline" className="mt-2 h-7 text-[11px] gap-1" asChild>
                  <Link to="/pricing"><Zap className="w-3 h-3" /> {lang === 'fr' ? 'Passer Premium' : 'Go Premium'}</Link>
                </Button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Activity stats */}
        <div>
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-1.5"><Radar className="w-4 h-4 text-primary" /> {lang === 'fr' ? 'Activité' : 'Activity'}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: lang === 'fr' ? 'Scans' : 'Scans', value: stats.scans, icon: Radar },
              { label: lang === 'fr' ? 'Entreprises' : 'Businesses', value: stats.businesses, icon: Building2 },
              { label: lang === 'fr' ? 'Leads suivis' : 'Tracked leads', value: stats.leadsTotal, icon: Users },
              { label: lang === 'fr' ? 'Contactées' : 'Contacted', value: stats.leadsContacted, icon: PhoneCall },
            ].map(s => (
              <div key={s.label} className="glass rounded-xl p-3 text-center">
                <s.icon className="w-4 h-4 text-primary mx-auto mb-1" />
                <div className="text-lg font-bold font-mono">{s.value}</div>
                <div className="text-[10px] text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        {recentActivity.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-1.5"><Clock className="w-4 h-4 text-primary" /> {lang === 'fr' ? 'Entreprises suivies récemment' : 'Recently tracked businesses'}</h2>
            <div className="glass rounded-xl divide-y divide-border/50">
              {recentActivity.map(a => (
                <div key={a.id} className="flex items-center justify-between px-3 py-2.5">
                  <span className="text-xs sm:text-sm truncate">{a.business_name}</span>
                  <Badge variant="outline" className="text-[9px] shrink-0 ml-2">{a.status}</Badge>
                </div>
              ))}
            </div>
            <Link to="/leads" className="text-[11px] text-primary hover:underline mt-2 inline-block">
              {lang === 'fr' ? 'Voir tous les leads →' : 'View all leads →'}
            </Link>
          </div>
        )}

        {/* Editable form */}
        <div>
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-1.5"><User className="w-4 h-4 text-primary" /> {lang === 'fr' ? 'Informations' : 'Information'}</h2>
          <div className="glass rounded-xl p-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('profile.name')}</Label>
              <Input id="name" value={profile.full_name} onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))} placeholder="John Doe" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">{t('profile.company')}</Label>
              <Input id="company" value={profile.company} onChange={e => setProfile(p => ({ ...p, company: e.target.value }))} placeholder="Acme Inc." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{t('profile.phone')}</Label>
              <Input id="phone" value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} placeholder="+237..." />
            </div>
            <Button onClick={saveProfile} disabled={loading} className="w-full gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {t('common.save')}
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
