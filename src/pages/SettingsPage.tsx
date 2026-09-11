import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import {
  Settings, Sun, Moon, Globe, User, Shield, FileText, ExternalLink,
  Radar, Info, Download, Bell, BellOff, UserCircle, Handshake, Check,
} from 'lucide-react';

export default function SettingsPage() {
  const { theme, setTheme, language, setLanguage } = useTheme();
  const { user, signOut } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const { canInstall, installed, promptInstall } = usePwaInstall();
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const isWindows = typeof navigator !== 'undefined' && /Windows/i.test(navigator.userAgent);

  useEffect(() => {
    if ('Notification' in window) {
      setPushEnabled(Notification.permission === 'granted');
    }
  }, []);

  const togglePush = async () => {
    if (!('Notification' in window)) return;
    setPushLoading(true);
    try {
      if (Notification.permission === 'granted') {
        setPushEnabled(false);
      } else {
        const perm = await Notification.requestPermission();
        setPushEnabled(perm === 'granted');
        if (perm === 'granted') {
          new Notification('Devora', { body: t('settings.pushEnabled'), icon: '/favicon.ico' });
        }
      }
    } catch {
    } finally {
      setPushLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 py-6 sm:py-10 space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Settings className="w-6 h-6 text-primary" /> {t('settings.title')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t('settings.subtitle')}</p>
        </motion.div>

        {/* Account */}
        <section className="glass rounded-lg p-4 space-y-3">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <User className="w-4 h-4 text-primary" /> {t('settings.account')}
          </h2>
          {user ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm">{user.email}</p>
                  <p className="text-xs text-muted-foreground">{t('settings.connected')}</p>
                </div>
                <Button size="sm" variant="outline" onClick={signOut} className="text-xs h-8">
                  {t('settings.signOut')}
                </Button>
              </div>
              <div className="flex gap-2">
                <Link to="/profile">
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                    <UserCircle className="w-3 h-3" /> {t('profile.title')}
                  </Button>
                </Link>
                <Link to="/collaboration">
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                    <Handshake className="w-3 h-3" /> {t('collab.title')}
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{t('settings.notConnected')}</p>
              <Link to="/auth">
                <Button size="sm" className="text-xs h-8">{t('settings.signIn')}</Button>
              </Link>
            </div>
          )}
        </section>

        {/* Notifications */}
        <section className="glass rounded-lg p-4 space-y-3">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" /> {t('settings.notifications')}
          </h2>
          <p className="text-xs text-muted-foreground">{t('settings.pushDesc')}</p>
          <Button size="sm" variant={pushEnabled ? 'secondary' : 'outline'} onClick={togglePush} disabled={pushLoading} className="text-xs h-8 gap-1.5">
            {pushEnabled ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
            {pushEnabled ? t('settings.pushEnabled') : t('settings.enablePush')}
          </Button>
        </section>

        {/* Theme */}
        <section className="glass rounded-lg p-4 space-y-3">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            {theme === 'dark' ? <Moon className="w-4 h-4 text-primary" /> : <Sun className="w-4 h-4 text-primary" />}
            {t('settings.theme')}
          </h2>
          <div className="flex gap-2">
            <button onClick={() => setTheme('dark')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border text-sm font-medium transition-all ${theme === 'dark' ? 'bg-primary/15 border-primary text-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}>
              <Moon className="w-4 h-4" /> {t('settings.dark')}
            </button>
            <button onClick={() => setTheme('light')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border text-sm font-medium transition-all ${theme === 'light' ? 'bg-primary/15 border-primary text-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}>
              <Sun className="w-4 h-4" /> {t('settings.light')}
            </button>
          </div>
        </section>

        {/* Language */}
        <section className="glass rounded-lg p-4 space-y-3">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary" /> {t('settings.language')}
          </h2>
          <div className="flex gap-2">
            <button onClick={() => setLanguage('fr')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border text-sm font-medium transition-all ${language === 'fr' ? 'bg-primary/15 border-primary text-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}>
              🇫🇷 Français
            </button>
            <button onClick={() => setLanguage('en')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border text-sm font-medium transition-all ${language === 'en' ? 'bg-primary/15 border-primary text-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}>
              🇬🇧 English
            </button>
          </div>
        </section>

        {/* Install App */}
        <section className="glass rounded-lg p-4 space-y-2">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Download className="w-4 h-4 text-primary" /> {t('settings.install')}
          </h2>
          {installed ? (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-primary" /> {language === 'fr' ? 'Application déjà installée sur cet appareil.' : 'App already installed on this device.'}
            </p>
          ) : canInstall ? (
            <>
              <p className="text-xs text-muted-foreground">{t('settings.installDesc')}</p>
              <Button
                size="sm"
                className="text-xs h-8 gap-1.5"
                onClick={async () => {
                  const outcome = await promptInstall();
                  if (outcome === 'accepted') {
                    toast({ title: language === 'fr' ? 'Installation lancée' : 'Installation started' });
                  }
                }}
              >
                <Download className="w-3.5 h-3.5" /> {t('settings.install')}
              </Button>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">{t('settings.installDesc')}</p>
          )}
          {isWindows && (
            <a href="https://github.com/Gianny-art/devora/releases/download/v1.0.0-desktop/devora-windows.zip" className="inline-block pt-1">
              <Button size="sm" variant="outline" className="text-xs h-8 gap-1.5">
                <Download className="w-3.5 h-3.5" /> {language === 'fr' ? 'Télécharger pour Windows' : 'Download for Windows'}
              </Button>
            </a>
          )}
        </section>

        {/* About */}
        <section className="glass rounded-lg p-4 space-y-3">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Info className="w-4 h-4 text-primary" /> {t('settings.about')}
          </h2>
          <p className="text-xs text-muted-foreground">{t('settings.aboutDesc')}</p>
          <Link to="/about">
            <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5">
              <Radar className="w-3 h-3" /> {t('settings.guide')}
            </Button>
          </Link>
        </section>

        {/* Legal */}
        <section className="glass rounded-lg p-4 space-y-2">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" /> {t('settings.legal')}
          </h2>
          <div className="flex flex-wrap gap-2">
            <Link to="/privacy">
              <Button size="sm" variant="ghost" className="h-7 text-xs gap-1">
                <Shield className="w-3 h-3" /> {t('settings.privacy')}
              </Button>
            </Link>
            <Link to="/legal">
              <Button size="sm" variant="ghost" className="h-7 text-xs gap-1">
                <FileText className="w-3 h-3" /> {t('settings.legalMentions')}
              </Button>
            </Link>
          </div>
        </section>

        <div className="text-center text-[10px] text-muted-foreground/50 pt-2">
          Devora v1.0 · © 2025-{new Date().getFullYear()} Foapa Gianny Robert
        </div>
      </div>
    </AppLayout>
  );
}
