import { useState } from 'react';
import { Business } from '@/types';
import { generateAudit, buildWhatsappUrl, AuditResult } from '@/lib/audit';
import { Button } from '@/components/ui/button';
import { FileSearch, MessageCircle, Lock, ChevronRight } from 'lucide-react';

interface Props {
  business: Business;
  canAudit: boolean;
  lang: 'fr' | 'en';
  onAuditGenerated?: () => void;
  onUpgradeClick?: () => void;
}

export function BusinessAuditPanel({ business, canAudit, lang, onAuditGenerated, onUpgradeClick }: Props) {
  const [audit, setAudit] = useState<AuditResult | null>(null);

  const handleGenerate = () => {
    if (!canAudit) {
      onUpgradeClick?.();
      return;
    }
    const result = generateAudit(business, lang);
    setAudit(result);
    onAuditGenerated?.();
  };

  if (!audit) {
    return (
      <Button size="sm" variant="outline" className="w-full h-8 text-xs gap-1.5" onClick={handleGenerate}>
        {canAudit ? <FileSearch className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
        {lang === 'fr' ? "Obtenir l'audit" : 'Get audit'}
        {!canAudit && <ChevronRight className="w-3 h-3 ml-auto" />}
      </Button>
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
