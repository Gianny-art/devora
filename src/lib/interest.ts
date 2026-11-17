import { Business } from '@/types';
import { getBusinessVisual } from '@/lib/business-visuals';

const interestKey = (userId?: string) => `devora.category_interest:${userId || 'guest'}`;
const scanKey = (userId?: string) => `devora.scan_insights:${userId || 'guest'}`;

type InterestMap = Record<string, number>;
type CategoryInsight = {
  scans: number;
  businesses: number;
  noWebsite: number;
  incompleteListing: number;
  score: number;
};
type InsightMap = Record<string, CategoryInsight>;

function read(userId?: string): InterestMap {
  try {
    return JSON.parse(localStorage.getItem(interestKey(userId)) || '{}');
  } catch {
    return {};
  }
}

function write(data: InterestMap, userId?: string) {
  try {
    localStorage.setItem(interestKey(userId), JSON.stringify(data));
  } catch {
    // ignore (private browsing, storage full, etc.)
  }
}

export function recordInterest(categoryLabel: string, weight = 1, userId?: string) {
  if (!categoryLabel) return;
  const data = read(userId);
  data[categoryLabel] = (data[categoryLabel] || 0) + weight;
  write(data, userId);
}

export function recordScanOutcomes(businesses: Business[], lang: 'fr' | 'en', userId?: string) {
  if (businesses.length === 0) return;
  try {
    const insights: InsightMap = JSON.parse(localStorage.getItem(scanKey(userId)) || '{}');
    const scanned = new Map<string, Business[]>();
    for (const business of businesses) {
      const label = getBusinessVisual(business.category).label[lang];
      scanned.set(label, [...(scanned.get(label) || []), business]);
    }

    for (const [category, entries] of scanned) {
      const current = insights[category] || { scans: 0, businesses: 0, noWebsite: 0, incompleteListing: 0, score: 0 };
      const noWebsite = entries.filter(entry => !entry.hasWebsite).length;
      const incompleteListing = entries.filter(entry => entry.opportunityReasons?.some(reason => reason !== 'no_website')).length;
      insights[category] = {
        scans: current.scans + 1,
        businesses: current.businesses + entries.length,
        noWebsite: current.noWebsite + noWebsite,
        incompleteListing: current.incompleteListing + incompleteListing,
        score: current.score + noWebsite * 3 + incompleteListing,
      };
      recordInterest(category, noWebsite * 2 + incompleteListing, userId);
    }

    localStorage.setItem(scanKey(userId), JSON.stringify(insights));
  } catch {
    // Recommendations remain optional when browser storage is unavailable.
  }
}

export function getTopCategories(limit = 3, userId?: string): {
  category: string;
  score: number;
  scans: number;
  businesses: number;
  noWebsite: number;
  incompleteListing: number;
}[] {
  const data = read(userId);
  let insights: InsightMap = {};
  try {
    insights = JSON.parse(localStorage.getItem(scanKey(userId)) || '{}');
  } catch {
    insights = {};
  }
  const categories = new Set([...Object.keys(data), ...Object.keys(insights)]);
  return [...categories]
    .map(category => {
      const insight = insights[category];
      return {
        category,
        score: (data[category] || 0) + (insight?.score || 0),
        scans: insight?.scans || 0,
        businesses: insight?.businesses || 0,
        noWebsite: insight?.noWebsite || 0,
        incompleteListing: insight?.incompleteListing || 0,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
