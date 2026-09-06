import { motion } from 'framer-motion';
import { Business } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getBusinessVisual, getNeedSummary, getNeedLevel } from '@/lib/business-visuals';
import { MapPin, Star, ArrowRight, Globe, Flame } from 'lucide-react';

const toneClass: Record<string, string> = {
  critical: 'bg-score-none/15 text-score-none border-score-none/40',
  high: 'bg-score-bad/15 text-score-bad border-score-bad/40',
  medium: 'bg-score-average/15 text-score-average border-score-average/40',
  low: 'bg-score-good/15 text-score-good border-score-good/40',
};

interface Props {
  business: Business;
  lang?: 'fr' | 'en';
  featured?: boolean;
  rank?: number;
  active?: boolean;
  onConsult: () => void;
}

export function BusinessHeroCard({ business, lang = 'fr', featured, rank, active, onConsult }: Props) {
  const visual = getBusinessVisual(business.category);
  const need = getNeedLevel(business.hasWebsite, business.opportunityScore);
  const summary = getNeedSummary(
    { name: business.name, category: business.category, hasWebsite: business.hasWebsite, opportunityScore: business.opportunityScore, rating: business.rating },
    lang
  );
  const consult = lang === 'fr' ? 'Consulter' : 'Consult';

  if (featured) {
    return (
      <motion.article
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={onConsult}
        className={`group relative overflow-hidden rounded-3xl border cursor-pointer transition-all ${
          active ? 'border-primary/60 shadow-[0_0_0_1px_hsl(var(--primary)/0.3)]' : 'border-border/60 hover:border-primary/40'
        }`}
      >
        <div className="relative h-[240px] sm:h-[320px]">
          <img
            src={visual.image}
            alt={`${business.name} — ${visual.label[lang]}`}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/10" />
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <Badge variant="outline" className={`text-[10px] backdrop-blur-md ${toneClass[need.tone]}`}>
              <Flame className="w-3 h-3 mr-1" /> {need[lang]}
            </Badge>
            {typeof rank === 'number' && (
              <Badge variant="outline" className="text-[10px] backdrop-blur-md bg-background/50">
                #{rank + 1}
              </Badge>
            )}
          </div>
          {business.opportunityScore != null && (
            <div className="absolute top-4 right-4 rounded-2xl bg-background/60 backdrop-blur-md border border-border/50 px-3 py-1.5 text-center">
              <div className="text-xl font-mono font-black text-primary leading-none">{business.opportunityScore}</div>
              <div className="text-[9px] text-muted-foreground uppercase tracking-wider">score</div>
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
            <p className="text-[10px] uppercase tracking-[0.2em] text-primary mb-1.5">{visual.label[lang]}</p>
            <h3 className="text-2xl sm:text-4xl font-bold leading-tight mb-2">{business.name}</h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mb-4">{summary}</p>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg" className="rounded-full gap-2 shadow-lg shadow-primary/20" onClick={(e) => { e.stopPropagation(); onConsult(); }}>
                {consult} <ArrowRight className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                {business.address && (
                  <span className="flex items-center gap-1 max-w-[180px] truncate"><MapPin className="w-3 h-3 shrink-0" />{business.address}</span>
                )}
                {business.rating && <span className="flex items-center gap-1"><Star className="w-3 h-3 text-warning" />{business.rating}/5</span>}
              </div>
            </div>
          </div>
        </div>
      </motion.article>
    );
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onConsult}
      className={`group flex gap-3 items-stretch overflow-hidden rounded-2xl border bg-card/60 backdrop-blur-xl cursor-pointer transition-all ${
        active ? 'border-primary/60' : 'border-border/50 hover:border-primary/30'
      }`}
    >
      <div className="relative w-24 sm:w-32 shrink-0 overflow-hidden">
        <img
          src={visual.image}
          alt={`${business.name} — ${visual.label[lang]}`}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card/40" />
      </div>

      <div className="flex-1 min-w-0 py-3 pr-3 flex flex-col justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-sm sm:text-base truncate group-hover:text-primary transition-colors">
                {typeof rank === 'number' && <span className="text-muted-foreground font-mono mr-1.5">{rank + 1}.</span>}
                {business.name}
              </h3>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">{visual.label[lang]}</p>
            </div>
            {business.opportunityScore != null && (
              <span className="text-sm font-mono font-bold text-primary shrink-0">{business.opportunityScore}</span>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5 line-clamp-2">{summary}</p>
        </div>

        <div className="flex items-center justify-between gap-2">
          <Badge variant="outline" className={`text-[9px] ${toneClass[need.tone]}`}>
            {business.hasWebsite ? <Globe className="w-2.5 h-2.5 mr-1" /> : <Flame className="w-2.5 h-2.5 mr-1" />}
            {need[lang]}
          </Badge>
          <Button size="sm" variant="ghost" className="h-7 rounded-full text-[11px] text-primary hover:bg-primary/10 gap-1"
            onClick={(e) => { e.stopPropagation(); onConsult(); }}>
            {consult} <ArrowRight className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </motion.article>
  );
}
