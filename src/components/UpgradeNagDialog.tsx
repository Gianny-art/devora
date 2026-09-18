import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Zap, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason: 'scan' | 'audit' | 'export' | 'suggestions';
  lang: 'fr' | 'en';
}

const COPY: Record<Props['reason'], { fr: [string, string]; en: [string, string] }> = {
  scan: {
    fr: ['Vos 2 scans gratuits sont utilisés', 'Passez à Premium pour scanner sans limite, partout dans le monde.'],
    en: ['Your 2 free scans are used up', 'Upgrade to Premium for unlimited scanning, worldwide.'],
  },
  audit: {
    fr: ["L'audit est une fonctionnalité Premium", "Débloquez l'audit de présence numérique et l'envoi WhatsApp prêt à l'emploi avec Premium."],
    en: ['Audit is a Premium feature', 'Unlock the digital presence audit and one-click WhatsApp outreach with Premium.'],
  },
  export: {
    fr: ["L'export est une fonctionnalité Premium", 'Exportez vos scans en PDF ou Excel, avec toutes les coordonnées, en un clic.'],
    en: ['Export is a Premium feature', 'Export your scans to PDF or Excel, with full contact details, in one click.'],
  },
  suggestions: {
    fr: ['Suggestions intelligentes', 'Fonctionnalité Premium : Devora analyse vos habitudes de scan et vous recommande les secteurs les plus prometteurs.'],
    en: ['Smart suggestions', 'Premium feature: Devora analyzes your scanning habits and recommends the most promising sectors.'],
  },
};

const PERKS: Record<'fr' | 'en', string[]> = {
  fr: ['Scans illimités, dans le monde entier', 'Audit entreprise + envoi WhatsApp', 'Export PDF / Excel', 'Suggestions intelligentes', 'Collaboration en équipe'],
  en: ['Unlimited scans, worldwide', 'Business audit + WhatsApp outreach', 'PDF / Excel export', 'Smart suggestions', 'Team collaboration'],
};

export function UpgradeNagDialog({ open, onOpenChange, reason, lang }: Props) {
  const navigate = useNavigate();
  const [title, desc] = COPY[reason][lang];
  const perks = PERKS[lang];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{desc}</DialogDescription>
        </DialogHeader>
        <ul className="space-y-1.5 py-2">
          {perks.map(p => (
            <li key={p} className="flex items-center gap-2 text-xs text-secondary-foreground">
              <Check className="w-3.5 h-3.5 text-primary shrink-0" /> {p}
            </li>
          ))}
        </ul>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button className="w-full gap-1.5" onClick={() => { onOpenChange(false); navigate('/pricing'); }}>
            <Zap className="w-4 h-4" /> {lang === 'fr' ? 'Voir les plans Premium' : 'View Premium plans'}
          </Button>
          <Button variant="ghost" className="w-full text-xs" onClick={() => onOpenChange(false)}>
            {lang === 'fr' ? 'Plus tard' : 'Later'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
