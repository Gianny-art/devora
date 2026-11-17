import { useState } from 'react';
import { Business } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { calculateOpportunityScore } from '@/lib/mock-data';
import { recordScanOutcomes } from '@/lib/interest';
import { filterBusinessesByDomains } from '@/lib/discovery';

type DiscoverBusinessesResponse = {
  success: boolean;
  premium?: boolean;
  businesses: Business[];
  error?: string;
};

export function useGeolocation() {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const getPosition = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      setLoading(true);
      setError(null);
      if (!navigator.geolocation) {
        const err = 'La géolocalisation n’est pas prise en charge par cet appareil.';
        setError(err);
        setLoading(false);
        reject(new Error(err));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setPosition(loc);
          setLoading(false);
          resolve(loc);
        },
        (err) => {
          console.error('Geolocation error:', err.message);
          const message = 'Impossible d’obtenir votre position exacte. Autorisez la localisation puis réessayez.';
          setError(message);
          setLoading(false);
          reject(new Error(message));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  };

  return { position, error, loading, getPosition };
}

export function useScanner() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanSaveError, setScanSaveError] = useState<string | null>(null);
  const [scanPhase, setScanPhase] = useState<'idle' | 'location' | 'discovery' | 'qualification' | 'complete'>('idle');
  const [serverVerifiedPremium, setServerVerifiedPremium] = useState<boolean | null>(null);
  const [scanProgress, setScanProgress] = useState<{ scanned: number; total: number; current: Business | null; recent: Business[] }>({
    scanned: 0,
    total: 0,
    current: null,
    recent: [],
  });
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const geo = useGeolocation();

  const checkDuplicateScan = async (userId: string, results: Business[]): Promise<string | null> => {
    try {
      // Get recent scans from last 7 days
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: recentScans } = await supabase
        .from('scans')
        .select('id, business_count, created_at')
        .eq('user_id', userId)
        .gte('created_at', weekAgo)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!recentScans || recentScans.length === 0) return null;

      // For each recent scan, check if businesses match
      for (const scan of recentScans) {
        if (Math.abs(scan.business_count - results.length) > 5) continue;
        
        const { data: scanBiz } = await supabase
          .from('scan_businesses')
          .select('name')
          .eq('scan_id', scan.id)
          .limit(100);
        
        if (!scanBiz) continue;
        
        const existingNames = new Set(scanBiz.map(b => b.name.toLowerCase().trim()));
        const newNames = results.map(b => b.name.toLowerCase().trim());
        const matches = newNames.filter(n => existingNames.has(n)).length;
        const matchRate = matches / Math.max(existingNames.size, newNames.length);
        
        if (matchRate > 0.8) {
          const date = new Date(scan.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
          return `Ce scan est très similaire à celui du ${date} (${Math.round(matchRate * 100)}% d'entreprises identiques). Vérifiez votre historique.`;
        }
      }
      return null;
    } catch {
      return null;
    }
  };

  const startScan = async (radius = 5, userId?: string, premium = false, domains?: string[], lang: 'fr' | 'en' = 'fr'): Promise<boolean> => {
    setScanning(true);
    setScanPhase('location');
    setScanComplete(false);
    setScanError(null);
    setScanSaveError(null);
    setDuplicateWarning(null);
    setServerVerifiedPremium(null);
    setBusinesses([]);
    setScanProgress({ scanned: 0, total: 0, current: null, recent: [] });

    try {
      const pos = await geo.getPosition();
      setScanPhase('discovery');

      const timeoutMs = radius > 100 ? 140000 : 60000;
      const invokePromise = supabase.functions.invoke<DiscoverBusinessesResponse>('discover-businesses', {
        body: { lat: pos.lat, lng: pos.lng, radius, ...(domains?.length ? { domains } : {}) },
      });
      let timeoutId: ReturnType<typeof setTimeout> | undefined;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('Le scan prend plus de temps que prévu. Réessayez ou réduisez le rayon.')), timeoutMs);
      });

      const { data, error } = await Promise.race([invokePromise, timeoutPromise]).finally(() => {
        if (timeoutId) clearTimeout(timeoutId);
      });

      if (error) {
        let message = error.message;
        const context = (error as { context?: { json?: () => Promise<{ error?: string }> } }).context;
        if (context?.json) {
          try {
            const body = await context.json();
            if (body.error) message = body.error;
          } catch {
            // Keep the original Functions error when the response body is unavailable.
          }
        }
        throw new Error(message);
      }
      if (!data?.success) throw new Error(data?.error || 'Scan failed');
      const verifiedPremium = data.premium ?? premium;
      setServerVerifiedPremium(verifiedPremium);

      setScanPhase('qualification');
      const discovered: Business[] = (data.businesses || []).map(biz => ({
        ...biz,
        rating: biz.rating || null,
        opportunityScore: biz.opportunityScore ?? calculateOpportunityScore(biz.hasWebsite, undefined, biz.rating),
      }));
      const results = filterBusinessesByDomains(discovered, domains);

      setBusinesses(results);
      recordScanOutcomes(results, lang, userId);
      const candidates = results.filter(business =>
        !business.hasWebsite || (business.opportunityReasons?.length || 0) >= 4
      );
      const animationSteps = Math.min(candidates.length, 20);
      for (let step = 0; step < animationSteps; step += 1) {
        await new Promise(resolve => setTimeout(resolve, 110));
        const scanned = Math.ceil(((step + 1) / animationSteps) * candidates.length);
        setScanProgress({
          scanned,
          total: candidates.length,
          current: candidates[scanned - 1],
          recent: candidates.slice(Math.max(0, scanned - 4), scanned),
        });
      }

      // Check for duplicate scan
      if (verifiedPremium && userId && results.length > 0) {
        const warning = await checkDuplicateScan(userId, results);
        if (warning) setDuplicateWarning(warning);
      }

      if (verifiedPremium && userId && results.length > 0) {
        try {
          const { data: scanRow, error: scanError } = await supabase.from('scans').insert({
            user_id: userId,
            lat: pos.lat,
            lng: pos.lng,
            radius,
            business_count: results.length,
          }).select('id').single();
          if (scanError) throw scanError;

          const bizRows = results.map((b: Business) => ({
            scan_id: scanRow.id,
            name: b.name,
            address: b.address || '',
            city: b.city || null,
            district: b.district || null,
            phone: b.phone || null,
            email: b.email || null,
            category: b.category || '',
            rating: b.rating || null,
            website: b.website || null,
            has_website: b.hasWebsite,
            opportunity_score: b.opportunityScore ?? null,
            lat: b.lat,
            lng: b.lng,
          }));
          const { error: businessesError } = await supabase.from('scan_businesses').insert(bizRows);
          if (businessesError) throw businessesError;
        } catch (error) {
          console.error('Unable to save premium scan:', error);
          setScanSaveError(error instanceof Error ? error.message : 'Impossible d’enregistrer ce scan.');
        }
      }
      setScanComplete(true);
      setScanPhase('complete');
      return true;
    } catch (err: unknown) {
      console.error('Scan error:', err);
      setScanError(err instanceof Error ? err.message : 'Scan failed');
      return false;
    } finally {
      setScanning(false);
    }
  };

  return { ...geo, businesses, scanning, scanComplete, scanError, scanSaveError, scanPhase, scanProgress, serverVerifiedPremium, duplicateWarning, startScan };
}
