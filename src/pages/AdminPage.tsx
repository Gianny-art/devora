import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { isAdmin } from '@/lib/admin';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Shield, Users, Zap, Radar, TrendingUp, Search, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';

type AdminUser = {
  id: string;
  email: string;
  full_name: string | null;
  company: string | null;
  plan: string;
  plan_expires_at: string | null;
  created_at: string;
  scanCount: number;
  leadCount: number;
  totalPaidXaf: number;
};

type Totals = {
  userCount: number;
  premiumCount: number;
  totalScans: number;
  totalLeads: number;
  totalRevenueXaf: number;
};

export default function AdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-users', { body: { action: 'list' } });
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || 'Failed to load users');
      setUsers(data.users);
      setTotals(data.totals);
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && isAdmin(user.email)) fetchUsers();
  }, [user]);

  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin(user.email)) return <Navigate to="/dashboard" replace />;

  const updatePlan = async (userId: string, plan: string) => {
    setSavingId(userId);
    try {
      const plan_expires_at = plan === 'premium' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null;
      const { data, error } = await supabase.functions.invoke('admin-users', {
        body: { action: 'update', userId, plan, plan_expires_at },
      });
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || 'Failed to update');
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, plan, plan_expires_at } : u));
      toast({ title: 'Mis à jour', description: 'Le plan a été modifié.' });
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    } finally {
      setSavingId(null);
    }
  };

  const filtered = users.filter(u =>
    (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.company || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-10">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Shield className="w-6 h-6 text-primary" /> Administration</h1>
          <p className="text-sm text-muted-foreground mt-1">Utilisateurs, abonnements et activité de la plateforme.</p>
        </motion.div>

        {totals && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
            {[
              { label: 'Utilisateurs', value: totals.userCount, icon: Users },
              { label: 'Premium', value: totals.premiumCount, icon: Zap },
              { label: 'Scans', value: totals.totalScans, icon: Radar },
              { label: 'Leads', value: totals.totalLeads, icon: TrendingUp },
              { label: 'Revenus (XAF)', value: totals.totalRevenueXaf.toLocaleString('fr-FR'), icon: Wallet },
            ].map(s => (
              <div key={s.label} className="glass rounded-xl p-3 text-center">
                <s.icon className="w-4 h-4 text-primary mx-auto mb-1" />
                <div className="text-lg font-bold font-mono">{s.value}</div>
                <div className="text-[10px] text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        <div className="relative max-w-sm mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un utilisateur..." className="pl-9" />
        </div>

        {loading ? (
          <div className="glass rounded-lg p-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></div>
        ) : (
          <div className="glass rounded-lg overflow-x-auto">
            <table className="w-full text-xs sm:text-sm min-w-[720px]">
              <thead>
                <tr className="border-b border-border/50 text-left text-muted-foreground">
                  <th className="px-3 py-2.5 font-medium">Utilisateur</th>
                  <th className="px-3 py-2.5 font-medium">Plan</th>
                  <th className="px-3 py-2.5 font-medium text-center">Scans</th>
                  <th className="px-3 py-2.5 font-medium text-center">Leads</th>
                  <th className="px-3 py-2.5 font-medium text-center">Payé (XAF)</th>
                  <th className="px-3 py-2.5 font-medium">Inscrit le</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id} className="border-b border-border/30 last:border-0 hover:bg-secondary/30">
                    <td className="px-3 py-2.5">
                      <div className="font-medium truncate max-w-[200px]">{u.full_name || u.email}</div>
                      <div className="text-[10px] text-muted-foreground truncate max-w-[200px]">{u.email}{u.company ? ` · ${u.company}` : ''}</div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        {isAdmin(u.email) ? (
                          <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">Admin</Badge>
                        ) : (
                          <Select value={u.plan} onValueChange={(v) => updatePlan(u.id, v)} disabled={savingId === u.id}>
                            <SelectTrigger className="h-7 w-[110px] text-[11px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="free">Free</SelectItem>
                              <SelectItem value="premium">Premium</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                        {savingId === u.id && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-center font-mono">{u.scanCount}</td>
                    <td className="px-3 py-2.5 text-center font-mono">{u.leadCount}</td>
                    <td className="px-3 py-2.5 text-center font-mono">{u.totalPaidXaf.toLocaleString('fr-FR')}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{new Date(u.created_at).toLocaleDateString('fr-FR')}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">Aucun utilisateur trouvé.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
