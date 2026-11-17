import { useState } from 'react';
import { useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ArrowUpRight, LockKeyhole, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { BrandLogo } from '@/components/BrandLogo';

export default function AuthPage() {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/dashboard';
  const { toast } = useToast();
  const { t, lang } = useTranslation();

  if (!authLoading && user) return <Navigate to={redirectTo} replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'forgot') {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setLoading(false);
      if (error) {
        toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
      } else {
        toast({ title: t('auth.checkEmail'), description: t('auth.resetLinkSent') });
        setMode('signin');
      }
      return;
    }

    if (mode === 'signup' && password !== confirmPassword) {
      toast({
        title: t('common.error'),
        description: lang === 'fr' ? 'Les mots de passe ne correspondent pas.' : 'Passwords do not match.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    const { error } = mode === 'signin'
      ? await signIn(email, password)
      : await signUp(email, password, redirectTo);
    setLoading(false);
    if (error) {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
    } else {
      if (mode === 'signup') {
        toast({ title: t('auth.checkEmail'), description: t('auth.confirmationSent') });
      } else {
        navigate(redirectTo);
      }
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute -left-40 top-0 h-[34rem] w-[34rem] rounded-full bg-primary/10 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-48 right-0 h-[34rem] w-[34rem] rounded-full bg-accent/10 blur-[120px]" />
      <div className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-4 py-8 sm:px-8 lg:grid-cols-[1fr_0.9fr] lg:gap-20">
        <section className="hidden lg:block">
          <a href="/" aria-label="Devora"><BrandLogo /></a>
          <div className="mt-16 max-w-xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              {lang === 'fr' ? 'Prospection locale, plus intelligente' : 'Smarter local prospecting'}
            </div>
            <h1 className="text-5xl font-bold leading-[1.08] tracking-tight xl:text-6xl">
              {lang === 'fr' ? <>Trouvez votre prochain client.<br /><span className="text-gradient">Pas au hasard.</span></> : <>Find your next client.<br /><span className="text-gradient">Not by chance.</span></>}
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-muted-foreground">
              {lang === 'fr'
                ? 'Repérez les entreprises locales, comprenez leurs opportunités digitales et transformez vos recherches en prospects suivis.'
                : 'Discover local businesses, understand their digital opportunities, and turn research into qualified leads.'}
            </p>
            <div className="mt-10 grid gap-3 sm:grid-cols-2">
              {[
                { icon: ShieldCheck, text: lang === 'fr' ? 'Vos données restent privées' : 'Your data stays private' },
                { icon: LockKeyhole, text: lang === 'fr' ? 'Connexion sécurisée' : 'Secure sign-in' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="glass flex items-center gap-3 rounded-xl p-4 text-sm text-muted-foreground">
                  <Icon className="h-4 w-4 text-primary" /> {text}
                </div>
              ))}
            </div>
          </div>
          <div className="relative mt-14 h-40 max-w-md overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card/40 to-accent/10">
            {[64, 112, 160, 208].map(size => (
              <div key={size} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/20" style={{ width: size, height: size }} />
            ))}
            <div className="absolute left-1/2 top-1/2 h-1 w-32 origin-left animate-radar-sweep bg-gradient-to-r from-primary/80 to-transparent" />
            <div className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_24px_hsl(var(--primary))]" />
          </div>
        </section>

        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <a href="/" aria-label="Devora"><BrandLogo compact /></a>
            <a href="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-3.5 w-3.5" /> {lang === 'fr' ? 'Accueil' : 'Home'}
            </a>
          </div>
          <div className="glass-strong rounded-3xl p-6 sm:p-9">
            <div className="mb-7">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">
                {mode === 'signup' ? (lang === 'fr' ? 'Rejoindre Devora' : 'Join Devora') : mode === 'forgot' ? (lang === 'fr' ? 'Récupération du compte' : 'Account recovery') : (lang === 'fr' ? 'Espace de travail' : 'Workspace')}
              </p>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {mode === 'forgot' ? t('auth.forgotPassword') : mode === 'signin' ? t('auth.welcomeBack') : t('auth.createAccount')}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {mode === 'forgot' ? t('auth.forgotSubtitle') : mode === 'signin' ? t('auth.signInSubtitle') : t('auth.signUpSubtitle')}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.email')}</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="vous@exemple.com" className="h-11 bg-background/60 pl-10" required />
                </div>
              </div>
              {mode !== 'forgot' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">{t('auth.password')}</Label>
                    {mode === 'signin' && (
                      <button type="button" onClick={() => setMode('forgot')} className="text-xs text-primary hover:underline">
                        {t('auth.forgotPassword')}
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="password" type="password" autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="h-11 bg-background/60 pl-10" required minLength={6} />
                  </div>
                </div>
              )}
              {mode === 'signup' && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{lang === 'fr' ? 'Confirmer le mot de passe' : 'Confirm password'}</Label>
                  <Input id="confirmPassword" type="password" autoComplete="new-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" className="h-11 bg-background/60" required minLength={6} />
                </div>
              )}
              <Button type="submit" className="h-11 w-full gap-2 rounded-xl shadow-lg shadow-primary/15" disabled={loading}>
                {loading ? t('auth.loading') : mode === 'forgot' ? t('auth.sendResetLink') : mode === 'signin' ? t('auth.signIn') : t('auth.signUp')}
                {!loading && <ArrowUpRight className="h-4 w-4" />}
              </Button>
            </form>

            <div className="my-6 flex items-center gap-3">
              <span className="h-px flex-1 bg-border" />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{lang === 'fr' ? 'ou' : 'or'}</span>
              <span className="h-px flex-1 bg-border" />
            </div>
            <a
              href="https://kroma-agence.com/login"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-11 items-center justify-center gap-2 rounded-xl border border-border/70 bg-background/35 px-4 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/35 hover:text-foreground"
            >
              {lang === 'fr' ? 'Accéder à l’espace partenaire Kroma' : 'Visit the Kroma partner portal'}
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>

            <div className="mt-6 text-center text-sm">
              <button type="button" onClick={() => setMode(mode === 'forgot' ? 'signin' : mode === 'signin' ? 'signup' : 'signin')} className="text-muted-foreground transition-colors hover:text-primary">
                {mode === 'forgot' ? t('auth.backToSignIn') : mode === 'signin' ? t('auth.noAccount') : t('auth.hasAccount')}
              </button>
            </div>
            <p className="mt-6 text-center text-[10px] leading-5 text-muted-foreground/70">
              {lang === 'fr' ? 'En continuant, vous acceptez nos conditions d’utilisation et notre politique de confidentialité.' : 'By continuing, you agree to our Terms of Service and Privacy Policy.'}
            </p>
          </div>
          <a href="https://kroma-agence.com/" target="_blank" rel="noopener noreferrer" className="mt-5 block text-center text-xs text-muted-foreground hover:text-primary">
            {lang === 'fr' ? 'Conçu avec Kroma Agence' : 'Built with Kroma Agency'}
          </a>
        </div>
      </div>
    </div>
  );
}
