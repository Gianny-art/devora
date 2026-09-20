import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Radar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function AuthPage() {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, lang } = useTranslation();

  if (!authLoading && user) return <Navigate to="/dashboard" replace />;

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
    const fn = mode === 'signin' ? signIn : signUp;
    const { error } = await fn(email, password);
    setLoading(false);
    if (error) {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
    } else {
      if (mode === 'signup') {
        toast({ title: t('auth.checkEmail'), description: t('auth.confirmationSent') });
      } else {
        navigate('/dashboard');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
              <Radar className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xl font-bold">Devora</span>
          </div>
          <h1 className="text-2xl font-bold">
            {mode === 'forgot' ? t('auth.forgotPassword') : mode === 'signin' ? t('auth.welcomeBack') : t('auth.createAccount')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === 'forgot' ? t('auth.forgotSubtitle') : mode === 'signin' ? t('auth.signInSubtitle') : t('auth.signUpSubtitle')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t('auth.email')}</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>
          {mode !== 'forgot' && (
            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.password')}</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
            </div>
          )}
          {mode === 'signup' && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{lang === 'fr' ? 'Confirmer le mot de passe' : 'Confirm password'}</Label>
              <Input id="confirmPassword" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
            </div>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t('auth.loading') : mode === 'forgot' ? t('auth.sendResetLink') : mode === 'signin' ? t('auth.signIn') : t('auth.signUp')}
          </Button>
        </form>

        <div className="text-center text-sm space-y-1">
          {mode === 'signin' && (
            <button onClick={() => setMode('forgot')} className="text-muted-foreground hover:text-primary hover:underline block mx-auto text-xs">
              {t('auth.forgotPassword')}
            </button>
          )}
          <button onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')} className="text-primary hover:underline">
            {mode === 'forgot' ? t('auth.backToSignIn') : mode === 'signin' ? t('auth.noAccount') : t('auth.hasAccount')}
          </button>
        </div>
      </div>
    </div>
  );
}
