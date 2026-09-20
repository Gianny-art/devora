import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/components/NotificationBell';
import { Radar, LayoutDashboard, Users, LogOut, Settings, UserCircle, Handshake } from 'lucide-react';
import { useRef } from 'react';
import devoraLogo from '@/assets/devora-logo.png';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { to: '/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { to: '/leads', label: t('nav.leads'), icon: Users },
    { to: '/scan', label: t('nav.scanner'), icon: Radar, isScan: true },
    { to: '/collaboration', label: t('collab.collaborators'), icon: Handshake },
    { to: '/settings', label: t('nav.settings'), icon: Settings },
  ];

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const currentIndex = navItems.findIndex(n => n.to === location.pathname);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;
    if (Math.abs(dx) < 80 || Math.abs(dx) < Math.abs(dy)) return;
    if (currentIndex === -1) return;
    if (dx < 0 && currentIndex < navItems.length - 1) navigate(navItems[currentIndex + 1].to);
    else if (dx > 0 && currentIndex > 0) navigate(navItems[currentIndex - 1].to);
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between">
          <Link to="/landing" className="flex items-center gap-1.5 shrink-0">
            <img src={devoraLogo} alt="DEVora" className="h-9 sm:h-11 w-auto object-contain" />
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1.5">
            {navItems.map(({ to, label, icon: Icon, isScan }) => (
              <Link key={to} to={to}>
                {isScan ? (
                  <Button
                    variant="scanner"
                    size="sm"
                    className={`gap-1.5 px-4 shadow-[0_0_16px_hsl(var(--primary)/0.25)] ${location.pathname === to ? 'ring-2 ring-primary/40' : ''}`}
                  >
                    <Icon className="w-4 h-4" /> {label}
                  </Button>
                ) : (
                  <Button variant={location.pathname === to ? 'secondary' : 'ghost'} size="sm" className="gap-1.5">
                    <Icon className="w-3.5 h-3.5" /> {label}
                  </Button>
                )}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <NotificationBell />
            {user ? (
              <>
                <Link to="/profile">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <UserCircle className="w-4 h-4" />
                  </Button>
                </Link>
                <Button variant="ghost" size="icon" onClick={signOut} className="h-8 w-8">
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <Link to="/auth">
                <Button size="sm">{t('nav.signIn')}</Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      <main className="pt-14 sm:pt-16 pb-16 md:pb-0 min-h-screen" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        {children}
      </main>

      {/* Mobile bottom tab bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/50" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="flex items-stretch h-14 w-full">
          {navItems.map(({ to, label, icon: Icon, isScan }) => {
            const isActive = location.pathname === to;
            if (isScan) {
              return (
                <Link key={to} to={to} className="relative flex flex-col items-center justify-center min-w-0 flex-1">
                  <div
                    className={`absolute -top-6 w-14 h-14 rounded-full flex items-center justify-center shadow-[0_4px_20px_hsl(var(--primary)/0.45)] border-4 border-background transition-transform active:scale-95 ${isActive ? 'bg-primary' : 'bg-primary'}`}
                  >
                    <Icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <span className={`text-[9px] font-semibold leading-none mt-7 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>{label}</span>
                </Link>
              );
            }
            return (
              <Link key={to} to={to} className={`flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-primary' : ''}`} />
                <span className="text-[9px] font-medium leading-none truncate max-w-full px-0.5">{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
