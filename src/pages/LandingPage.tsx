import { motion } from 'framer-motion';
import { Link, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Radar, ArrowRight, Zap, Globe, BarChart3, Users, Handshake, History } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/contexts/AuthContext';
import devoraLogo from '@/assets/devora-logo.png';

export default function LandingPage() {
  const { t } = useTranslation();
  const { user, loading } = useAuth();

  if (!loading && user) return <Navigate to="/dashboard" replace />;

  const features = [
    { icon: Radar, title: t('landing.feature.scanning'), desc: t('landing.feature.scanning.desc') },
    { icon: Globe, title: t('landing.feature.map'), desc: t('landing.feature.map.desc') },
    { icon: BarChart3, title: t('landing.feature.score'), desc: t('landing.feature.score.desc') },
    { icon: Users, title: t('landing.feature.crm'), desc: t('landing.feature.crm.desc') },
    { icon: Handshake, title: t('landing.feature.collab'), desc: t('landing.feature.collab.desc') },
    { icon: History, title: t('landing.feature.history'), desc: t('landing.feature.history.desc') },
  ];

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      {/* Fixed nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-1.5 shrink-0">
            <img src={devoraLogo} alt="DEVora" className="h-10 sm:h-12 w-auto object-contain" />
          </Link>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link to="/auth">
              <Button variant="ghost" size="sm" className="text-xs sm:text-sm h-8 px-2 sm:px-3">{t('nav.signIn')}</Button>
            </Link>
            <Link to="/scan">
              <Button size="sm" variant="scanner" className="gap-1 text-xs sm:text-sm h-8 px-2.5 sm:px-3">
                <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="hidden xs:inline">Start</span> Scan
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero - compact on mobile */}
      <section className="pt-16 sm:pt-28 pb-6 sm:pb-16 px-4 flex-shrink-0">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-xs text-primary mb-3 sm:mb-6">
              <Zap className="w-3 h-3" /> {t('landing.badge')}
            </div>
            <h1 className="text-2xl sm:text-5xl md:text-7xl font-black tracking-tight mb-2 sm:mb-6">
              {t('landing.hero.title1')}{' '}
              <span className="text-gradient">{t('landing.hero.title2')}</span>
            </h1>
            <p className="text-xs sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-4 sm:mb-8 px-2">
              {t('landing.hero.desc')}
            </p>
            <div className="flex flex-row items-center justify-center gap-2 sm:gap-3">
              <Link to="/scan">
                <Button variant="scanner" size="sm" className="gap-1.5 sm:gap-2 text-xs sm:text-base sm:h-11 sm:px-6">
                  <Radar className="w-4 h-4 sm:w-5 sm:h-5" /> {t('landing.hero.cta')} <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              </Link>
              <Link to="/pricing">
                <Button variant="outline" size="sm" className="text-xs sm:text-base sm:h-11 sm:px-6">{t('landing.hero.pricing')}</Button>
              </Link>
            </div>
          </motion.div>

          {/* Radar animation - smaller on mobile */}
          <motion.div className="relative mt-6 sm:mt-14 mx-auto" style={{ width: 150, height: 150 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            {[1, 2, 3].map((ring) => (
              <motion.div key={ring} className="absolute rounded-full border border-primary/15"
                style={{ width: ring * 50, height: ring * 50, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
                animate={{ scale: [1, 1.03, 1], opacity: [0.3, 0.15, 0.3] }}
                transition={{ duration: 3, repeat: Infinity, delay: ring * 0.4 }}
              />
            ))}
            <motion.div className="absolute top-1/2 left-1/2 w-[75px] h-0.5 origin-left"
              style={{ background: 'linear-gradient(90deg, hsl(var(--primary) / 0.6), transparent)', marginTop: -1 }}
              animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary shadow-[0_0_12px_hsl(var(--primary)/0.3)]" />
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-6 sm:py-16 px-4 flex-shrink-0">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-4 sm:mb-12">
            <h2 className="text-lg sm:text-3xl font-bold mb-1 sm:mb-3">{t('landing.features.title')}</h2>
            <p className="text-xs sm:text-base text-muted-foreground">{t('landing.features.subtitle')}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4">
            {features.map((f, i) => (
              <motion.div key={f.title} className="glass rounded-lg p-2.5 sm:p-5 hover:border-primary/30 transition-all"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}>
                <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-1.5 sm:mb-3">
                  <f.icon className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-[11px] sm:text-base mb-0.5 sm:mb-1 leading-tight">{f.title}</h3>
                <p className="text-[9px] sm:text-sm text-muted-foreground leading-tight">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-6 sm:py-16 px-4 flex-shrink-0">
        <div className="max-w-xl mx-auto text-center gradient-radar rounded-2xl p-4 sm:p-10 border border-primary/20">
          <h2 className="text-base sm:text-2xl font-bold mb-2 sm:mb-3">{t('landing.cta.title')}</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-6">{t('landing.cta.desc')}</p>
          <Link to="/scan">
            <Button variant="scanner" size="sm" className="gap-2 sm:h-11 sm:px-6 sm:text-base">
              <Radar className="w-4 h-4" /> {t('landing.cta.button')}
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-4 sm:py-8 px-4 mt-auto">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-[10px] sm:text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Radar className="w-3 h-3 text-primary" />
            <span>Devora © {new Date().getFullYear()} · Foapa Gianny Robert</span>
          </div>
          <div className="flex gap-2 sm:gap-4">
            <Link to="/about" className="hover:text-foreground transition-colors">{t('settings.about')}</Link>
            <Link to="/pricing" className="hover:text-foreground transition-colors">{t('nav.plans')}</Link>
            <Link to="/auth" className="hover:text-foreground transition-colors">{t('nav.signIn')}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
