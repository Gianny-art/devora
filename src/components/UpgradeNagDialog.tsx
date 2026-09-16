import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Zap, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason: 'scan' | 'audit';
  lang: 'fr' | 'en';
}

export function UpgradeNagDialog({ open, onOpenChange, reason, lang }: Props) {
  const navigate = useNavigate();

  const title = lang === 'fr'
    ? (reason === 'scan' ? 'Vos 2 scans gratuits sont utilisés' : "L'audit est une fonctionnalité Premium")
    : (reason === 'scan' ? 'Your 2 free scans are used up' : 'Audit is a Premium feature');

  const desc = lang === 'fr'
    ? (reason === 'scan'
      ? 'Passez à Premium pour scanner sans limite, jusqu\'à 50km à la ronde.'
      : "Débloquez l'audit de présence numérique et l'envoi WhatsApp prêt à l'emploi avec Premium.")
    : (reason === 'scan'
      ? 'Upgrade to Premium for unlimited scanning, up to 50km around you.'
      : 'Unlock the digital presence audit and one-click WhatsApp outreach with Premium.');

  const perks = lang === 'fr'
    ? ['Scans illimités', 'Audit entreprise + envoi WhatsApp', 'Suggestions intelligentes', 'Collaboration en équipe']
    : ['Unlimited scans', 'Business audit + WhatsApp outreach', 'Smart suggestions', 'Team collaboration'];

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
