// The one account that can never be demoted — everyone else's admin access is
// granted explicitly, from the admin panel, via the `role` column on profiles.
export const OWNER_EMAIL = 'giannyfoapa@gmail.com';

export function isOwner(email?: string | null): boolean {
  if (!email) return false;
  return email.toLowerCase() === OWNER_EMAIL;
}

/** Admin = the owner, or a user explicitly granted the 'admin' role by the owner. */
export function isAdmin(email?: string | null, role?: string | null): boolean {
  return isOwner(email) || role === 'admin';
}

export const PLAN_RADIUS_LIMITS: Record<string, number> = {
  free: 10,
  premium: 500,
};

export const PLAN_LIMITS: Record<string, { maxScansTotal: number; maxAudits: number }> = {
  free: { maxScansTotal: 2, maxAudits: 0 },
  premium: { maxScansTotal: Infinity, maxAudits: Infinity },
};

export const FREE_TIER_LIMITS = PLAN_LIMITS.free;

export function getMaxRadius(plan: string): number {
  return PLAN_RADIUS_LIMITS[plan] || 10;
}

export function getAvailableRadii(plan: string): number[] {
  const max = getMaxRadius(plan);
  const all = [1, 5, 10, 25, 50, 100, 200, 500];
  return all.filter(r => r <= max);
}

export function getPlanLimits(plan: string) {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.free;
}

/** Plan status only — being an admin does not imply Premium. */
export function isPremium(plan: string): boolean {
  return plan === 'premium';
}
