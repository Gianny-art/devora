import { beforeEach, describe, expect, it } from 'vitest';
import { getTopCategories, recordScanOutcomes } from '@/lib/interest';
import { filterBusinessesByDomains, getDomainForCategory } from '@/lib/discovery';
import { Business } from '@/types';

const business = (overrides: Partial<Business>): Business => ({
  id: 'test',
  name: 'Local business',
  address: 'Yaoundé',
  category: 'restaurant',
  lat: 3.86,
  lng: 11.52,
  hasWebsite: false,
  opportunityScore: 10,
  opportunityReasons: ['no_website'],
  ...overrides,
});

describe('discovery recommendations', () => {
  beforeEach(() => localStorage.clear());

  it('maps French category labels to the scan domain used by the API', () => {
    expect(getDomainForCategory('Restauration')).toBe('catering');
    expect(getDomainForCategory('Santé')).toBe('healthcare');
    expect(getDomainForCategory('Éducation')).toBe('education');
  });

  it('keeps scan results limited to selected domains, including legacy API responses', () => {
    const results = filterBusinessesByDomains([
      business({ id: 'restaurant', category: 'Restaurant' }),
      business({ id: 'clinic', category: 'Clinic' }),
      business({ id: 'explicit', category: 'Restaurant', discoveryDomains: ['commercial'] }),
    ], ['catering']);

    expect(results.map(result => result.id)).toEqual(['restaurant']);
  });

  it('ranks scanned sectors with missing websites above complete listings', () => {
    recordScanOutcomes([
      business({ id: '1', category: 'restaurant' }),
      business({ id: '2', category: 'restaurant' }),
      business({
        id: '3',
        category: 'pharmacy',
        hasWebsite: true,
        opportunityScore: 0,
        opportunityReasons: [],
      }),
    ], 'fr', 'user-1');

    const categories = getTopCategories(3, 'user-1');
    expect(categories[0]).toMatchObject({ category: 'Restauration', noWebsite: 2, businesses: 2 });
    expect(getTopCategories(3, 'user-2')).toEqual([]);
  });
});
