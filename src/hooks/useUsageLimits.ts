import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { isAdmin, getPlanLimits } from '@/lib/admin';

export function useUsageLimits(userPlan: string) {
  const { user } = useAuth();
  const [dailyScanCount, setDailyScanCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const userIsAdmin = isAdmin(user?.email);
  const limits = getPlanLimits(userPlan);

  useEffect(() => {
    if (!user) {
      setDailyScanCount(0);
      setLoading(false);
      return;
    }
    fetchCounts();
  }, [user]);

  const fetchCounts = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { count } = await supabase.from('scans').select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', todayStart.toISOString());
      setDailyScanCount(count ?? 0);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  const canScanToday = userIsAdmin || dailyScanCount < limits.maxDailyScans;

  const incrementDailyScan = () => setDailyScanCount(c => c + 1);

  return {
    dailyScanCount, limits,
    canScanToday,
    incrementDailyScan, loading,
  };
}
