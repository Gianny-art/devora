import { useState } from 'react';
import { Business } from '@/types';
import { buildPageSpeedAudit, generateAudit, buildWhatsappUrl, AuditResult, PageSpeedReport } from '@/lib/audit';
import { Button } from '@/components/ui/button';
import { FileSearch, MessageCircle, Lock, ChevronRight, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  business: Business;
  canAudit: boolean;
  lang: 'fr' | 'en';
  onAuditGenerated?: () => void;
  onAuditResult?: (audit: AuditResult) => void;
  onUpgradeClick?: () => void;
}

export function BusinessAuditPanel({ business, canAudit, lang, onAuditGenerated, onAuditResult, onUpgradeClick }: Props) {
  const [audit, setAudit] = useState<AuditResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!canAudit) {
      onUpgradeClick?.();
      return;
    }
    setAuditError(null);
    setLoading(true);
    try {
      let result: AuditResult;
      if (business.hasWebsite && business.website) {
        const { data, error } = await supabase.functions.invoke('audit-website', {
          body: { website: business.website, lang },
        });
        if (error) {
          let message = error.message;
          const context = (error as { context?: { json?: () => Promise<{ error?: string }> } }).context;
          if (context?.json) {
            try {
              const body = await context.json();
              if (body.error) message = body.error;
            } catch {
              // Preserve the Functions error when the response body cannot be read.
            }
          }
          throw new Error(message);
        }
        if (data?.error) throw new Error(data.error);
        result = buildPageSpeedAudit(business, data as PageSpeedReport, lang);
      } else if (business.hasWebsite) {
        throw new Error(lang === 'fr' ? 'L’adresse du site n’est pas disponible pour effectuer un audit PageSpeed.' : 'The website URL is unavailable for a PageSpeed audit.');
      } else {
        result = generateAudit(business, lang);
      }
      setAudit(result);
      onAuditResult?.(result);
      onAuditGenerated?.();
    } catch (error) {
      console.error('Unable to audit business presence:', error);
      setAuditError(error instanceof Error ? error.message : (lang === 'fr' ? 'L’audit a échoué.' : 'The audit failed.'));
    } finally {
      setLoading(false);
    }
  };

  if (!audit) {
    return (
      <div className="space-y-2">
        <Button size="sm" variant="outline" className="w-full h-9 text-xs gap-1.5" onClick={() => { void handleGenerate(); }} disabled={loading}>
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : canAudit ? <FileSearch className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
          {loading
            ? (lang === 'fr' ? 'Analyse PageSpeed en cours…' : 'Running PageSpeed audit…')
            : lang === 'fr' ? "Obtenir l'audit" : 'Get audit'}
          {!canAudit && <ChevronRight className="w-3 h-3 ml-auto" />}
        </Button>
        {business.hasWebsite && business.website && (
          <p className="text-[9px] leading-relaxed text-muted-foreground">
            {lang === 'fr'
              ? 'Analyse PageSpeed mobile : performance, accessibilité, bonnes pratiques et SEO. Le design et l’originalité nécessitent une revue humaine.'
              : 'Mobile PageSpeed checks performance, accessibility, best practices, and SEO. Design and originality require human review.'}
          </p>
        )}
        {auditError && <p role="alert" className="rounded-lg border border-destructive/25 bg-destructive/5 p-2 text-[10px] text-destructive">{auditError}</p>}
      </div>
    );
  }

  const whatsappUrl = buildWhatsappUrl(business, audit);

  return (
    <div className="glass rounded-lg p-3 space-y-2.5">
      <div className="flex items-center justify-between">
        <h4 className="text-xs sm:text-sm font-semibold flex items-center gap-1.5">
          <FileSearch className="w-3.5 h-3.5 text-primary" /> {lang === 'fr' ? "Audit de présence numérique" : 'Digital presence audit'}
        </h4>
        <span className="text-xs font-mono font-bold text-primary">{audit.score}/10</span>
      </div>

      {audit.source === 'pagespeed' && (
        <div className="space-y-2 rounded-lg border border-border/50 bg-background/30 p-2.5">
          <p className="text-[9px] text-muted-foreground">
            {lang === 'fr' ? 'Mesures PageSpeed mobile · ' : 'Mobile PageSpeed · '}
            {audit.auditedAt ? new Date(audit.auditedAt).toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' }) : ''}
          </p>
          {audit.categoryScores?.map(category => (
            <div key={category.label} className="flex items-center gap-2">
              <span className="w-24 shrink-0 text-[9px] text-muted-foreground">{category.label}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${category.score ?? 0}%` }} />
              </div>
              <span className="w-8 text-right font-mono text-[9px]">{category.score === null ? '—' : category.score}</span>
            </div>
          ))}
          {audit.metrics && audit.metrics.length > 0 && (
            <div className="grid grid-cols-2 gap-1 border-t border-border/40 pt-2">
              {audit.metrics.map(metric => (
                <div key={metric.label} className="min-w-0">
                  <p className="truncate text-[8px] text-muted-foreground">{metric.label}</p>
                  <p className="text-[9px] font-medium">{metric.value || '—'}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {audit.source === 'listing' && (
        <p className="rounded-lg border border-border/50 bg-background/30 p-2 text-[9px] leading-relaxed text-muted-foreground">
          {lang === 'fr'
            ? 'Évaluation des informations publiques disponibles uniquement ; aucune mesure technique du site n’a été effectuée.'
            : 'This only evaluates available public listing details; no technical website measurements were performed.'}
        </p>
      )}

      <div>
        <p className="text-[10px] sm:text-xs font-semibold mb-1">{lang === 'fr' ? 'Problèmes détectés' : 'Issues detected'}</p>
        <ul className="text-[10px] sm:text-xs text-muted-foreground space-y-1">
          {audit.problems.map((p, i) => (
            <li key={i} className="flex items-start gap-1"><span className="text-destructive shrink-0">•</span><span>{p}</span></li>
          ))}
        </ul>
      </div>

      <div>
        <p className="text-[10px] sm:text-xs font-semibold mb-1">{lang === 'fr' ? 'Recommandations' : 'Recommendations'}</p>
        <ul className="text-[10px] sm:text-xs text-muted-foreground space-y-1">
          {audit.recommendations.map((r, i) => (
            <li key={i} className="flex items-start gap-1"><span className="text-primary shrink-0">✓</span><span>{r}</span></li>
          ))}
        </ul>
      </div>

      <details className="text-[10px] sm:text-xs">
        <summary className="font-semibold cursor-pointer">{lang === 'fr' ? "Message d'approche" : 'Outreach message'}</summary>
        <div className="text-muted-foreground bg-secondary/50 rounded p-2 whitespace-pre-wrap mt-1">{audit.pitch}</div>
      </details>

      {whatsappUrl && (
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="block">
          <Button size="sm" className="w-full h-8 text-xs gap-1.5 bg-[#25D366] hover:bg-[#1ebc59] text-white">
            <MessageCircle className="w-3.5 h-3.5" /> {lang === 'fr' ? 'Envoyer sur WhatsApp' : 'Send via WhatsApp'}
          </Button>
        </a>
      )}
    </div>
  );
}
