import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getPlanLimits } from '@/lib/admin';

export function useUsageLimits(userPlan: string) {
  const { user } = useAuth();
  const [scanCount, setScanCount] = useState(0);
  const [auditCount, setAuditCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const limits = getPlanLimits(userPlan);

  useEffect(() => {
    if (!user) {
      setScanCount(0);
      setAuditCount(0);
      setLoading(false);
      return;
    }
    fetchCounts();
  }, [user]);

  const fetchCounts = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { count } = await supabase.from('scans').select('id', { count: 'exact', head: true }).eq('user_id', user.id);
      setScanCount(count ?? 0);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  const canScan = scanCount < limits.maxScansTotal;
  const canAudit = auditCount < limits.maxAudits;

  const incrementScan = () => setScanCount(c => c + 1);
  const incrementAudit = () => setAuditCount(c => c + 1);

  return {
    scanCount, auditCount, limits,
    canScan, canAudit,
    incrementScan, incrementAudit, loading,
  };
}
