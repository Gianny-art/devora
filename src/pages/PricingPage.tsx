import { useState, useEffect, useRef } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { PLAN_FEATURES, PlanTier } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Check, Zap, Loader2, Smartphone, CheckCircle2, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const tiers: PlanTier[] = ['free', 'premium', 'premium_plus'];
type Provider = 'campay' | 'maviance';
type PaymentState = 'idle' | 'form' | 'pending' | 'success' | 'failed' | 'timeout';

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 90000;

export default function PricingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t, lang } = useTranslation();
  const [currentTier, setCurrentTier] = useState<string>('free');
  const [activeTier, setActiveTier] = useState<PlanTier | null>(null);
  const [provider, setProvider] = useState<Provider>('campay');
  const [phone, setPhone] = useState('');
  const [paymentState, setPaymentState] = useState<PaymentState>('idle');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (user) checkSubscription();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [user]);

  const checkSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (!error && data?.plan) setCurrentTier(data.plan);
    } catch {}
  };

  const openPaymentForm = (tier: PlanTier) => {
    if (!user) {
      toast({ title: t('pricing.loginRequired'), description: t('pricing.loginToSubscribe'), variant: 'destructive' });
      return;
    }
    setActiveTier(tier);
    setPaymentState('form');
    setPaymentError(null);
    setPhone('');
  };

  const closePaymentForm = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveTier(null);
    setPaymentState('idle');
  };

  const submitPayment = async () => {
    if (!activeTier || !phone.trim()) return;
    setPaymentState('pending');
    setPaymentError(null);
    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { tier: activeTier, provider, phone: phone.trim() },
      });
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || (lang === 'fr' ? 'Échec du paiement' : 'Payment failed'));

      const reference: string = data.reference;
      const startedAt = Date.now();
      pollRef.current = setInterval(async () => {
        const { data: payment } = await supabase.from('payments').select('status').eq('external_reference', reference).single();
        if (payment?.status === 'success') {
          if (pollRef.current) clearInterval(pollRef.current);
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          setPaymentState('success');
          checkSubscription();
        } else if (payment?.status === 'failed') {
          if (pollRef.current) clearInterval(pollRef.current);
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          setPaymentState('failed');
        } else if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
          if (pollRef.current) clearInterval(pollRef.current);
          setPaymentState('timeout');
        }
      }, POLL_INTERVAL_MS);
    } catch (err: any) {
      setPaymentError(err.message);
      setPaymentState('form');
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-3">{t('pricing.title')}</h1>
          <p className="text-muted-foreground">{t('pricing.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((tier, i) => {
            const plan = PLAN_FEATURES[tier];
            const isPremiumPlus = tier === 'premium_plus';
            const isCurrent = tier === currentTier;
            const features = lang === 'fr' ? plan.featuresFr : plan.features;
            const isPaymentOpen = activeTier === tier;

            return (
              <motion.div
                key={tier}
                className={`glass rounded-lg p-6 flex flex-col ${isPremiumPlus ? 'border-primary/50 ring-1 ring-primary/20' : ''} ${isCurrent ? 'ring-2 ring-primary' : ''}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                {isCurrent && (
                  <Badge className="self-start mb-3 bg-primary/20 text-primary border-primary/30">
                    {t('pricing.yourPlan')}
                  </Badge>
                )}
                {isPremiumPlus && !isCurrent && (
                  <Badge className="self-start mb-3 bg-primary/10 text-primary border-primary/30">
                    <Zap className="w-3 h-3 mr-1" /> {t('pricing.popular')}
                  </Badge>
                )}
                <h3 className="text-lg font-bold">{plan.name}</h3>
                <div className="text-3xl font-black font-mono mt-2">{plan.price}</div>
                <p className="text-xs text-muted-foreground mt-1 mb-4">{t('pricing.scope')}: {plan.scanScope}</p>

                <ul className="space-y-2 flex-1 mb-6">
                  {features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-xs text-secondary-foreground">
                      <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                {tier === 'free' ? (
                  <Button variant="outline" size="sm" className="w-full" disabled>
                    {isCurrent ? t('pricing.currentPlan') : t('pricing.free')}
                  </Button>
                ) : isPaymentOpen ? (
                  <div className="space-y-2">
                    {paymentState === 'form' && (
                      <>
                        <div className="grid grid-cols-2 gap-1.5">
                          <Button type="button" size="sm" variant={provider === 'campay' ? 'secondary' : 'outline'} className="h-8 text-xs" onClick={() => setProvider('campay')}>
                            CamPay
                          </Button>
                          <Button type="button" size="sm" variant={provider === 'maviance' ? 'secondary' : 'outline'} className="h-8 text-xs" onClick={() => setProvider('maviance')}>
                            Maviance
                          </Button>
                        </div>
                        <Input
                          type="tel"
                          placeholder={lang === 'fr' ? 'Numéro (ex: 6XXXXXXXX)' : 'Phone number'}
                          value={phone}
                          onChange={e => setPhone(e.target.value)}
                          className="h-8 text-xs"
                        />
                        {paymentError && <p className="text-[10px] text-destructive">{paymentError}</p>}
                        <div className="flex gap-1.5">
                          <Button size="sm" className="flex-1 h-8 text-xs" disabled={!phone.trim()} onClick={submitPayment}>
                            <Smartphone className="w-3.5 h-3.5 mr-1" /> {lang === 'fr' ? 'Payer' : 'Pay'}
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={closePaymentForm}>
                            {lang === 'fr' ? 'Annuler' : 'Cancel'}
                          </Button>
                        </div>
                      </>
                    )}
                    {paymentState === 'pending' && (
                      <div className="flex flex-col items-center gap-2 py-3 text-center">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        <p className="text-[10px] text-muted-foreground">
                          {lang === 'fr' ? 'Confirmez la transaction sur votre téléphone...' : 'Confirm the transaction on your phone...'}
                        </p>
                      </div>
                    )}
                    {paymentState === 'success' && (
                      <div className="flex flex-col items-center gap-2 py-3 text-center">
                        <CheckCircle2 className="w-6 h-6 text-score-good" />
                        <p className="text-xs font-medium">{lang === 'fr' ? 'Paiement confirmé !' : 'Payment confirmed!'}</p>
                        <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={closePaymentForm}>OK</Button>
                      </div>
                    )}
                    {(paymentState === 'failed' || paymentState === 'timeout') && (
                      <div className="flex flex-col items-center gap-2 py-3 text-center">
                        <XCircle className="w-6 h-6 text-destructive" />
                        <p className="text-[10px] text-muted-foreground">
                          {paymentState === 'timeout'
                            ? (lang === 'fr' ? 'Délai dépassé — vérifiez votre téléphone ou réessayez.' : 'Timed out — check your phone or try again.')
                            : (lang === 'fr' ? 'Paiement échoué.' : 'Payment failed.')}
                        </p>
                        <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => setPaymentState('form')}>
                          {lang === 'fr' ? 'Réessayer' : 'Retry'}
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <Button
                    variant={isPremiumPlus ? 'scanner' : 'outline'}
                    size="sm"
                    className="w-full"
                    disabled={isCurrent}
                    onClick={() => openPaymentForm(tier)}
                  >
                    {isCurrent ? t('pricing.currentPlan') : `${t('pricing.subscribe')} · Mobile Money`}
                  </Button>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
