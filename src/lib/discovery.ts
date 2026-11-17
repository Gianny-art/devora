import type { Business } from '@/types';

export const DISCOVERY_DOMAINS = [
  { key: 'catering', label: { fr: 'Restaurants & cafés', en: 'Restaurants & cafés' } },
  { key: 'commercial', label: { fr: 'Commerces', en: 'Retail & shops' } },
  { key: 'healthcare', label: { fr: 'Santé', en: 'Healthcare' } },
  { key: 'accommodation', label: { fr: 'Hôtellerie', en: 'Accommodation' } },
  { key: 'education', label: { fr: 'Éducation', en: 'Education' } },
  { key: 'office_service', label: { fr: 'Bureaux & services', en: 'Offices & services' } },
  { key: 'leisure_sport', label: { fr: 'Loisirs & sport', en: 'Leisure & sport' } },
] as const;

const CATEGORY_DOMAIN_HINTS: Record<string, string> = {
  restaurant: 'catering',
  restaur: 'catering',
  cafe: 'catering',
  'caf': 'catering',
  bar: 'catering',
  bakery: 'catering',
  catering: 'catering',
  supermarket: 'commercial',
  shop: 'commercial',
  retail: 'commercial',
  commercial: 'commercial',
  commerce: 'commercial',
  commerç: 'commercial',
  pharmacy: 'healthcare',
  clinic: 'healthcare',
  hospital: 'healthcare',
  dentist: 'healthcare',
  healthcare: 'healthcare',
  santé: 'healthcare',
  hotel: 'accommodation',
  hostel: 'accommodation',
  accommodation: 'accommodation',
  hôteller: 'accommodation',
  school: 'education',
  university: 'education',
  education: 'education',
  éduc: 'education',
  office: 'office_service',
  service: 'office_service',
  gym: 'leisure_sport',
  sport: 'leisure_sport',
  leisure: 'leisure_sport',
};

export function getDomainForCategory(category: string): string | undefined {
  const normalized = category.toLowerCase();
  return Object.entries(CATEGORY_DOMAIN_HINTS).find(([hint]) => normalized.includes(hint))?.[1];
}

export function filterBusinessesByDomains(businesses: Business[], domains?: readonly string[]): Business[] {
  if (!domains?.length) return businesses;
  const selected = new Set(domains);
  return businesses.filter(business => {
    if (business.discoveryDomains !== undefined) {
      return business.discoveryDomains.some(domain => selected.has(domain));
    }
    const domain = getDomainForCategory(business.category);
    return domain !== undefined && selected.has(domain);
  });
}
