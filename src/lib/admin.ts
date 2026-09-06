const ADMIN_EMAILS = ['giannyfoapa@gmail.com', 'forlannoums@gmail.com'];

export function isAdmin(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

export const PLAN_RADIUS_LIMITS: Record<string, number> = {
  free: 10,
  premium: 50,
  premium_plus: 500,
};

export const PLAN_LIMITS: Record<string, { maxDailyScans: number }> = {
  free: { maxDailyScans: 2 },
  premium: { maxDailyScans: Infinity },
  premium_plus: { maxDailyScans: Infinity },
};

export const FREE_TIER_LIMITS = PLAN_LIMITS.free;

export function getMaxRadius(plan: string, email?: string | null): number {
  if (isAdmin(email)) return 500;
  return PLAN_RADIUS_LIMITS[plan] || 10;
}

export function getAvailableRadii(plan: string, email?: string | null): number[] {
  const max = getMaxRadius(plan, email);
  const all = [1, 5, 10, 25, 50, 100, 200, 500];
  return all.filter(r => r <= max);
}

export function getPlanLimits(plan: string) {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.free;
}
