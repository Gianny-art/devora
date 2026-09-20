import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, Unlock, Copy, Check, Share2, Loader2 } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scanId: string;
  lang: 'fr' | 'en';
}

export function ShareScanDialog({ open, onOpenChange, scanId, lang }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [access, setAccess] = useState<'view' | 'full'>('view');
  const [loading, setLoading] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('scan_shares')
        .insert({ scan_id: scanId, access, owner_id: user.id })
        .select('token')
        .single();
      if (error) throw error;
      setLink(`${window.location.origin}/shared/${data.token}`);
    } catch (err: any) {
      toast({ title: lang === 'fr' ? 'Erreur' : 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = (o: boolean) => {
    if (!o) { setLink(null); setAccess('view'); setCopied(false); }
    onOpenChange(o);
  };

  return (
    <Dialog open={open} onOpenChange={reset}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Share2 className="w-4 h-4 text-primary" /> {lang === 'fr' ? 'Partager ce scan' : 'Share this scan'}</DialogTitle>
          <DialogDescription>
            {lang === 'fr'
              ? 'Choisissez ce que la personne pourra faire avec ce scan.'
              : 'Choose what the recipient will be able to do with this scan.'}
          </DialogDescription>
        </DialogHeader>

        {!link ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => setAccess('view')}
                className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-colors ${access === 'view' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}
              >
                <Eye className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">{lang === 'fr' ? 'Lecture seule' : 'Read-only'}</p>
                  <p className="text-[11px] text-muted-foreground">{lang === 'fr' ? "La personne peut consulter les entreprises, sans les enregistrer ni générer d'audit." : 'The recipient can browse businesses, without saving them or generating an audit.'}</p>
                </div>
              </button>
              <button
                onClick={() => setAccess('full')}
                className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-colors ${access === 'full' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}
              >
                <Unlock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">{lang === 'fr' ? 'Utilisable à 100%' : '100% usable'}</p>
                  <p className="text-[11px] text-muted-foreground">{lang === 'fr' ? 'La personne peut enregistrer les entreprises dans ses leads et générer un audit.' : 'The recipient can save businesses to their own leads and generate an audit.'}</p>
                </div>
              </button>
            </div>
            <Button className="w-full gap-1.5" onClick={generate} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
              {lang === 'fr' ? 'Générer le lien' : 'Generate link'}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Input readOnly value={link} className="text-xs" onFocus={e => e.currentTarget.select()} />
              <Button size="icon" variant="outline" className="shrink-0" onClick={copyLink}>
                {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {lang === 'fr'
                ? "La personne devra se connecter (ou créer un compte) pour l'ouvrir."
                : 'The recipient will need to sign in (or create an account) to open it.'}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
