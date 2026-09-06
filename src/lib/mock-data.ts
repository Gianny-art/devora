import { Business } from '@/types';

export function calculateOpportunityScore(hasWebsite: boolean, _unused?: unknown, rating?: number): number {
  if (!hasWebsite) return Math.min(10, 7 + (rating ? (rating / 5) * 3 : 1));
  const ratingFactor = rating ? rating / 5 : 0.5;
  return Math.round(Math.min(10, Math.max(1, 3 + ratingFactor * 3)) * 10) / 10;
}

export function getMarkerColor(business: Business): string {
  if (!business.hasWebsite) return '#3b82f6'; // blue - opportunity
  return '#22c55e'; // green - already has a website
}
