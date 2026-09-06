import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Camera, Save, Loader2, User } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProfilePage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState({
    full_name: '',
    company: '',
    phone: '',
    avatar_url: '',
  });

  useEffect(() => {
    if (user) fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('full_name, company, phone, avatar_url')
      .eq('id', user!.id)
      .single();
    if (data) {
      setProfile({
        full_name: data.full_name || '',
        company: data.company || '',
        phone: data.phone || '',
        avatar_url: data.avatar_url || '',
      });
    }
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
      toast({ title: t('common.success'), description: 'Photo mise à jour' });
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

  const initials = profile.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user.email?.slice(0, 2).toUpperCase() || 'U';

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto px-4 py-6 sm:py-10 space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <User className="w-6 h-6 text-primary" /> {t('profile.title')}
          </h1>
        </motion.div>

        {/* Avatar */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <Avatar className="w-24 h-24 border-2 border-primary/30">
              <AvatarImage src={profile.avatar_url} />
              <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">{initials}</AvatarFallback>
            </Avatar>
            <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center cursor-pointer hover:bg-primary/80 transition-colors">
              {uploading ? <Loader2 className="w-4 h-4 text-primary-foreground animate-spin" /> : <Camera className="w-4 h-4 text-primary-foreground" />}
              <input type="file" accept="image/*" className="hidden" onChange={uploadAvatar} disabled={uploading} />
            </label>
          </div>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>

        {/* Form */}
        <div className="space-y-4">
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
    </AppLayout>
  );
}
