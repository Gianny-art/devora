import { useState } from 'react';
import { Business } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { calculateOpportunityScore } from '@/lib/mock-data';

export function useGeolocation() {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const getPosition = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      setLoading(true);
      setError(null);
      if (!navigator.geolocation) {
        const err = 'Geolocation is not supported';
        setError(err);
        setLoading(false);
        reject(err);
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
          setError('Impossible d\'obtenir votre position. Veuillez activer la localisation dans les paramètres de votre navigateur.');
          setLoading(false);
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
              setPosition(loc);
              resolve(loc);
            },
            () => {
              const fallback = { lat: 3.8667, lng: 11.5167 };
              setPosition(fallback);
              resolve(fallback);
            },
            { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
          );
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

  const startScan = async (radius = 5, userId?: string) => {
    setScanning(true);
    setScanComplete(false);
    setScanError(null);
    setDuplicateWarning(null);
    setBusinesses([]);

    try {
      const pos = await geo.getPosition();

      const timeoutMs = radius > 100 ? 45000 : 20000;
      const invokePromise = supabase.functions.invoke('discover-businesses', {
        body: { lat: pos.lat, lng: pos.lng, radius },
      });
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Le scan prend plus de temps que prévu. Réessayez ou réduisez le rayon.')), timeoutMs);
      });

      const { data, error } = await Promise.race([invokePromise, timeoutPromise]);

      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || 'Scan failed');

      const results: Business[] = (data.businesses || []).map((biz: any) => ({
        ...biz,
        rating: biz.rating || null,
        opportunityScore: biz.opportunityScore || calculateOpportunityScore(biz.hasWebsite, undefined, biz.rating),
      }));

      setBusinesses(results);
      setScanComplete(true);

      // Check for duplicate scan
      if (userId && results.length > 0) {
        const warning = await checkDuplicateScan(userId, results);
        if (warning) setDuplicateWarning(warning);
      }

      // Auto-save scan + businesses to database
      if (userId && results.length > 0) {
        const { data: scanRow } = await supabase.from('scans').insert({
          user_id: userId,
          lat: pos.lat,
          lng: pos.lng,
          radius,
          business_count: results.length,
        }).select('id').single();

        if (scanRow?.id) {
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
            opportunity_score: b.opportunityScore || null,
            lat: b.lat,
            lng: b.lng,
          }));
          await supabase.from('scan_businesses').insert(bizRows);
        }
      }
    } catch (err: any) {
      console.error('Scan error:', err);
      setScanError(err.message || 'Scan failed');
    } finally {
      setScanning(false);
    }
  };

  return { ...geo, businesses, scanning, scanComplete, scanError, duplicateWarning, startScan };
}
