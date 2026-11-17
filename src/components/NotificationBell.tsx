import { useState, useEffect, useCallback } from 'react';
import { Bell, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
};

export function NotificationBell() {
  const { user } = useAuth();
  const { t, lang } = useTranslation();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const unread = notifications.filter(n => !n.read).length;

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
      return;
    }
    if (data) setNotifications(data as Notification[]);
  }, [user, toast, t]);

  useEffect(() => {
    if (!user) return;
    void fetchNotifications();

    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        setNotifications(prev => [payload.new as Notification, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, fetchNotifications]);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [open]);

  const markAllRead = async () => {
    if (!user) return;
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length === 0) return;
    const { error } = await supabase.from('notifications').update({ read: true }).in('id', unreadIds).eq('user_id', user.id);
    if (error) {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
      return;
    }
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markRead = async (notification: Notification) => {
    if (!user || notification.read) return;
    const { error } = await supabase.from('notifications').update({ read: true }).eq('id', notification.id).eq('user_id', user.id);
    if (error) {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
      return;
    }
    setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, read: true } : n));
  };

  const dismiss = async (id: string) => {
    if (!user) return;
    const { error } = await supabase.from('notifications').delete().eq('id', id).eq('user_id', user.id);
    if (error) {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
      return;
    }
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  if (!user) return null;

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 relative"
        onClick={() => setOpen(!open)}
        aria-label={t('notif.title')}
        aria-expanded={open}
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-primary-foreground text-[9px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </Button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40 bg-black/20 sm:bg-transparent" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -5, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -5, scale: 0.97 }}
              role="dialog"
              aria-label={t('notif.title')}
              className="fixed left-1/2 top-16 -translate-x-1/2 w-[92vw] max-w-sm sm:absolute sm:left-auto sm:right-0 sm:top-10 sm:translate-x-0 sm:w-80 max-h-[70vh] glass-strong rounded-2xl border border-border shadow-2xl z-50 overflow-hidden"
            >
              <div className="flex items-center justify-between p-3.5 border-b border-border/50">
                <div>
                  <span className="text-sm font-semibold">{t('notif.title')}</span>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {unread} {lang === 'fr' ? 'non lue(s)' : 'unread'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {unread > 0 && (
                    <button onClick={markAllRead} className="text-[10px] text-primary hover:underline">
                      {t('notif.markAllRead')}
                    </button>
                  )}
                  <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full" onClick={() => setOpen(false)} aria-label={lang === 'fr' ? 'Fermer' : 'Close'}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="overflow-y-auto max-h-[55vh] sm:max-h-60">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-muted-foreground">
                    {t('notif.empty')}
                  </div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} className={`group flex items-start gap-2 border-b border-border/30 p-3 text-left transition-colors hover:bg-primary/5 ${!n.read ? 'bg-primary/[0.04]' : ''}`}>
                      <button onClick={() => markRead(n)} className="min-w-0 flex-1 text-left">
                        <div className="flex items-start gap-2">
                          {!n.read && <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                          <span className="min-w-0">
                            <span className="block text-xs font-semibold">{n.title}</span>
                            <span className="mt-0.5 block text-[11px] leading-relaxed text-muted-foreground">{n.message}</span>
                            <span className="mt-1 block text-[9px] text-muted-foreground/60">
                              {new Date(n.created_at).toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                            </span>
                          </span>
                        </div>
                      </button>
                      <div className="flex shrink-0 items-center gap-0.5">
                        {!n.read && <Check className="h-3 w-3 text-primary" />}
                        <Button size="icon" variant="ghost" className="h-6 w-6 rounded-full text-muted-foreground opacity-70 hover:text-destructive sm:opacity-0 sm:group-hover:opacity-100" onClick={() => dismiss(n.id)} aria-label={lang === 'fr' ? 'Supprimer la notification' : 'Dismiss notification'}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
