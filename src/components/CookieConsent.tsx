import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';
import { Cookie } from 'lucide-react';

const STORAGE_KEY = 'devora_cookie_consent';

export function CookieConsent() {
  const { lang } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch {
      // localStorage unavailable (private mode etc.) — skip banner
    }
  }, []);

  const accept = () => {
    try { localStorage.setItem(STORAGE_KEY, 'accepted'); } catch {}
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          className="fixed bottom-0 left-0 right-0 z-[100] p-3 sm:p-4"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.75rem)' }}
        >
          <div className="max-w-2xl mx-auto glass border border-border shadow-xl rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-start gap-2.5 flex-1">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Cookie className="w-4 h-4 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {lang === 'fr'
                  ? "Devora utilise des cookies nécessaires pour garder votre session active et vous éviter de vous reconnecter à chaque visite."
                  : 'Devora uses essential cookies to keep your session active so you don’t have to sign in again on every visit.'}
              </p>
            </div>
            <Button size="sm" onClick={accept} className="shrink-0 h-8 text-xs w-full sm:w-auto">
              {lang === 'fr' ? "J'accepte" : 'Accept'}
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
