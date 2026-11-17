import { AnimatePresence, motion } from 'framer-motion';
import { Check, Crosshair, LocateFixed, MapPin, Radar, ShoppingBasket } from 'lucide-react';
import { Business } from '@/types';

type ScanPhase = 'location' | 'discovery' | 'qualification';

type ScanProgress = {
  scanned: number;
  total: number;
  current: Business | null;
  recent: Business[];
};

interface ScanVisualizerProps {
  phase: ScanPhase;
  radiusKm: number;
  position: { lat: number; lng: number } | null;
  progress: ScanProgress;
  lang: 'fr' | 'en';
}

function getMapPoint(business: Business, position: ScanVisualizerProps['position'], radiusKm: number) {
  if (!position || radiusKm <= 0) return { x: 50, y: 50 };
  const longitudeRadius = radiusKm / (111.32 * Math.max(Math.cos(position.lat * Math.PI / 180), 0.1));
  const latitudeRadius = radiusKm / 111;
  return {
    x: Math.max(5, Math.min(95, 50 + ((business.lng - position.lng) / longitudeRadius) * 45)),
    y: Math.max(8, Math.min(92, 50 - ((business.lat - position.lat) / latitudeRadius) * 45)),
  };
}

export function ScanVisualizer({ phase, radiusKm, position, progress, lang }: ScanVisualizerProps) {
  const fr = lang === 'fr';
  const phaseLabel = phase === 'location'
    ? (fr ? 'Localisation GPS' : 'GPS location')
    : phase === 'discovery'
      ? (fr ? 'Balayage de la zone' : 'Scanning the area')
      : (fr ? 'Qualification des opportunités' : 'Qualifying opportunities');
  const percentage = progress.total > 0 ? Math.round((progress.scanned / progress.total) * 100) : 0;

  return (
    <motion.div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/65 p-3 backdrop-blur-md sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="scan-visualizer-title"
    >
      <motion.section
        className="glass-strong w-full max-w-5xl overflow-hidden rounded-3xl border border-primary/20 shadow-[0_25px_100px_rgba(0,0,0,0.55)]"
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 180, damping: 22 }}
      >
        <header className="flex items-center justify-between gap-4 border-b border-border/50 px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary">
              <Radar className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-primary">{fr ? 'Devora · Scan en cours' : 'Devora · Live scan'}</p>
              <h2 id="scan-visualizer-title" className="truncate text-sm font-semibold sm:text-base">{phaseLabel}</h2>
            </div>
          </div>
          <div className="shrink-0 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[10px] font-medium text-primary">
            {radiusKm} km
          </div>
        </header>

        <div className="grid gap-3 p-3 sm:gap-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div
            className="relative min-h-[280px] overflow-hidden rounded-2xl border border-primary/20 bg-[#071713] sm:min-h-[390px]"
            style={{
              backgroundImage: 'radial-gradient(ellipse at 50% 50%, rgba(32, 180, 125, .13), transparent 60%), linear-gradient(rgba(67, 196, 146, .08) 1px, transparent 1px), linear-gradient(90deg, rgba(67, 196, 146, .08) 1px, transparent 1px)',
              backgroundSize: 'auto, 32px 32px, 32px 32px',
              perspective: '900px',
            }}
          >
            <motion.div
              className="absolute -inset-[20%] opacity-70"
              style={{
                transform: 'rotateX(54deg) rotateZ(-14deg) scale(1.2)',
                backgroundImage: 'linear-gradient(32deg, transparent 47%, rgba(83, 208, 157, .2) 48%, rgba(83, 208, 157, .2) 49%, transparent 50%), linear-gradient(148deg, transparent 44%, rgba(83, 208, 157, .14) 45%, rgba(83, 208, 157, .14) 46%, transparent 47%), repeating-linear-gradient(90deg, transparent 0 62px, rgba(83, 208, 157, .08) 63px 65px), repeating-linear-gradient(0deg, transparent 0 52px, rgba(83, 208, 157, .08) 53px 55px)',
              }}
              animate={{ backgroundPosition: ['0px 0px', '0px 18px'] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
            />

            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#071713]/70" />
            <motion.div
              className="absolute inset-x-0 z-10 h-px bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_18px_4px_rgba(50,220,155,.45)]"
              animate={{ top: ['18%', '18%', '43%', '43%', '68%', '68%', '88%'] }}
              transition={{ duration: 4.8, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
              className="absolute z-20 text-primary drop-shadow-[0_0_10px_rgba(50,220,155,.9)]"
              animate={{
                left: ['8%', '92%', '92%', '8%', '8%', '92%', '92%'],
                top: ['18%', '18%', '43%', '43%', '68%', '68%', '88%'],
              }}
              transition={{ duration: 4.8, repeat: Infinity, ease: 'linear' }}
            >
              <Crosshair className="h-5 w-5 sm:h-6 sm:w-6" />
            </motion.div>

            {position && (
              <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
                <motion.div
                  className="absolute -inset-5 rounded-full border border-primary/45"
                  animate={{ scale: [0.7, 1.8], opacity: [0.65, 0] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
                />
                <div className="relative flex h-9 w-9 items-center justify-center rounded-full border border-primary/40 bg-primary/20 text-primary shadow-[0_0_28px_rgba(50,220,155,.45)]">
                  <LocateFixed className="h-4 w-4" />
                </div>
              </div>
            )}

            <AnimatePresence>
              {progress.recent.map((business, index) => {
                const point = getMapPoint(business, position, radiusKm);
                const isCurrent = business.id === progress.current?.id;
                return (
                  <motion.div
                    key={business.id}
                    className="absolute z-30 -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${point.x}%`, top: `${point.y}%` }}
                    initial={{ opacity: 0, scale: 0.2, y: 8 }}
                    animate={{ opacity: 1, scale: isCurrent ? 1.12 : 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.28 }}
                  >
                    <div className={`flex h-7 w-7 items-center justify-center rounded-full border shadow-lg ${isCurrent ? 'border-primary bg-primary text-primary-foreground' : 'border-primary/50 bg-background/90 text-primary'}`}>
                      {isCurrent ? <Check className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />}
                    </div>
                    <span className="absolute left-1/2 top-8 max-w-28 -translate-x-1/2 truncate rounded bg-black/70 px-1.5 py-0.5 text-[8px] text-white">
                      {business.name}
                    </span>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            <div className="absolute left-3 top-3 z-40 flex items-center gap-2 rounded-full border border-white/10 bg-black/45 px-2.5 py-1.5 text-[9px] text-white/85 backdrop-blur">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              {phase === 'qualification'
                ? (fr ? 'Résultats reçus · qualification en cours' : 'Results received · qualifying')
                : (fr ? 'Exploration de la zone' : 'Exploring the area')}
            </div>
            <div className="absolute bottom-3 left-3 z-40 flex items-center gap-1.5 text-[9px] text-white/60">
              <MapPin className="h-3 w-3 text-primary" />
              {position ? (fr ? 'Centre : votre position GPS' : 'Center: your GPS location') : (fr ? 'Acquisition de la position…' : 'Getting your location…')}
            </div>
          </div>

          <aside className="flex min-h-[185px] flex-col rounded-2xl border border-border/60 bg-background/45 p-3.5 backdrop-blur-xl sm:p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{fr ? 'Panier de prospection' : 'Prospect basket'}</p>
                <p className="mt-1 text-lg font-bold tabular-nums">{progress.scanned}<span className="ml-1 text-xs font-medium text-muted-foreground">/ {progress.total}</span></p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ShoppingBasket className="h-4 w-4" />
              </div>
            </div>

            <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-muted">
              {progress.total > 0 ? (
                <motion.div className="h-full rounded-full bg-primary" animate={{ width: `${percentage}%` }} transition={{ duration: 0.2 }} />
              ) : (
                <motion.div className="h-full w-1/3 rounded-full bg-primary" animate={{ x: ['-100%', '300%'] }} transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }} />
              )}
            </div>

            <div className="min-h-0 flex-1 space-y-1.5 overflow-hidden">
              {progress.recent.length === 0 ? (
                <div className="flex h-full min-h-20 flex-col items-center justify-center gap-2 text-center text-[10px] text-muted-foreground">
                  <Radar className="h-5 w-5 animate-pulse text-primary/70" />
                  {phase === 'location'
                    ? (fr ? 'Repérage de votre zone…' : 'Locating your area…')
                    : (fr ? 'Recherche des établissements…' : 'Finding businesses…')}
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {progress.recent.slice(-4).reverse().map((business, index) => (
                    <motion.div
                      key={business.id}
                      className="flex items-center gap-2 rounded-lg border border-border/40 bg-card/60 px-2 py-1.5"
                      initial={{ opacity: 0, x: 16, height: 0 }}
                      animate={{ opacity: 1, x: 0, height: 'auto' }}
                      exit={{ opacity: 0, x: -12, height: 0 }}
                      transition={{ duration: 0.22, delay: index * 0.035 }}
                    >
                      <Check className="h-3 w-3 shrink-0 text-primary" />
                      <span className="min-w-0 flex-1 truncate text-[10px] font-medium">{business.name}</span>
                      <span className="text-[8px] text-muted-foreground">{business.hasWebsite ? (fr ? 'Site' : 'Web') : (fr ? 'Sans site' : 'No site')}</span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            <p className="mt-3 border-t border-border/50 pt-2.5 text-[9px] leading-relaxed text-muted-foreground">
              {phase === 'qualification'
                ? (fr ? 'Les prospects sont ajoutés au panier à partir des résultats réellement reçus.' : 'Prospects are added from the actual results received.')
                : (fr ? 'Le balayage visuel continue pendant la recherche du service.' : 'The visual sweep continues while the search service runs.')}
            </p>
          </aside>
        </div>
      </motion.section>
    </motion.div>
  );
}
