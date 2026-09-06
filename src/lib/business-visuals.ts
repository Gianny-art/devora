const U = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=70`;

type Visual = { image: string; label: { fr: string; en: string } };

const VISUALS: { keys: string[]; visual: Visual }[] = [
  { keys: ['restaurant', 'food', 'fast_food', 'cuisine'], visual: { image: U('photo-1517248135467-4c7edcad34c4'), label: { fr: 'Restauration', en: 'Restaurant' } } },
  { keys: ['cafe', 'coffee', 'salon de thé'], visual: { image: U('photo-1445116572660-236099ec97a0'), label: { fr: 'Café & salon de thé', en: 'Coffee shop' } } },
  { keys: ['bar', 'pub', 'nightclub', 'lounge'], visual: { image: U('photo-1514933651103-005eec06c04b'), label: { fr: 'Bar & vie nocturne', en: 'Bar & nightlife' } } },
  { keys: ['bakery', 'boulangerie', 'pastry', 'pâtisserie'], visual: { image: U('photo-1509440159596-0249088772ff'), label: { fr: 'Boulangerie & pâtisserie', en: 'Bakery' } } },
  { keys: ['hotel', 'guest_house', 'hostel', 'auberge'], visual: { image: U('photo-1566073771259-6a8506099945'), label: { fr: 'Hôtellerie', en: 'Hospitality' } } },
  { keys: ['pharmacy', 'pharmacie', 'clinic', 'doctors', 'hospital', 'dentist', 'health'], visual: { image: U('photo-1587854692152-cbe660dbde88'), label: { fr: 'Santé', en: 'Healthcare' } } },
  { keys: ['hairdresser', 'beauty', 'salon', 'coiffure', 'spa'], visual: { image: U('photo-1560066984-138dadb4c035'), label: { fr: 'Beauté & bien-être', en: 'Beauty & wellness' } } },
  { keys: ['car', 'garage', 'car_repair', 'auto', 'fuel', 'tyres'], visual: { image: U('photo-1486262715619-67b85e0b08d3'), label: { fr: 'Automobile', en: 'Automotive' } } },
  { keys: ['gym', 'fitness', 'sport', 'sports'], visual: { image: U('photo-1534438327276-14e5300c3a48'), label: { fr: 'Sport & fitness', en: 'Sport & fitness' } } },
  { keys: ['school', 'college', 'university', 'education', 'école', 'formation', 'kindergarten'], visual: { image: U('photo-1523050854058-8df90110c9f1'), label: { fr: 'Éducation', en: 'Education' } } },
  { keys: ['bank', 'banque', 'finance', 'insurance', 'atm', 'accounting'], visual: { image: U('photo-1541354329998-f4d9a9f9297f'), label: { fr: 'Finance & assurance', en: 'Finance & insurance' } } },
  { keys: ['construction', 'builder', 'hardware', 'doityourself', 'quincaillerie'], visual: { image: U('photo-1503387762-592deb58ef4e'), label: { fr: 'BTP & matériaux', en: 'Construction' } } },
  { keys: ['clothes', 'boutique', 'fashion', 'shoes', 'mode', 'tailor'], visual: { image: U('photo-1490481651871-ab68de25d43d'), label: { fr: 'Mode & prêt-à-porter', en: 'Fashion & retail' } } },
  { keys: ['supermarket', 'grocery', 'convenience', 'alimentation', 'marketplace', 'greengrocer'], visual: { image: U('photo-1542838132-92c53300491e'), label: { fr: 'Alimentation & commerce', en: 'Grocery & retail' } } },
  { keys: ['computer', 'electronics', 'mobile_phone', 'informatique', 'telecom', 'internet_cafe'], visual: { image: U('photo-1519389950473-47ba0277781c'), label: { fr: 'Tech & électronique', en: 'Tech & electronics' } } },
  { keys: ['travel', 'agency', 'voyage', 'tourism'], visual: { image: U('photo-1436491865332-7a61a109cc05'), label: { fr: 'Voyage & tourisme', en: 'Travel & tourism' } } },
  { keys: ['shop', 'store', 'retail', 'commerce'], visual: { image: U('photo-1441986300917-64674bd600d8'), label: { fr: 'Commerce de détail', en: 'Retail' } } },
];

const FALLBACK: Visual = {
  image: U('photo-1497366754035-f200968a6e72'),
  label: { fr: 'Entreprise locale', en: 'Local business' },
};

export function getBusinessVisual(category?: string | null): Visual {
  const c = (category || '').toLowerCase();
  if (!c) return FALLBACK;
  for (const entry of VISUALS) {
    if (entry.keys.some(k => c.includes(k))) return entry.visual;
  }
  return FALLBACK;
}

/** Human-readable need summary used under the business name. */
export function getNeedSummary(
  opts: { name: string; category?: string | null; hasWebsite: boolean; opportunityScore?: number | null; rating?: number | null },
  lang: 'fr' | 'en' = 'fr'
): string {
  const sector = getBusinessVisual(opts.category).label[lang];
  const score = opts.opportunityScore || 0;
  if (lang === 'en') {
    if (!opts.hasWebsite) return `${sector} · no website yet — prime candidate for a first digital presence.`;
    if (score >= 7) return `${sector} · online presence is weak and losing customers.`;
    if (score >= 4) return `${sector} · site exists but needs a redesign and SEO work.`;
    return `${sector} · solid presence, room for optimisation.`;
  }
  if (!opts.hasWebsite) return `${sector} · aucun site web — candidat idéal pour une première présence en ligne.`;
  if (score >= 7) return `${sector} · présence en ligne faible, des clients lui échappent.`;
  if (score >= 4) return `${sector} · site existant à refondre, SEO à renforcer.`;
  return `${sector} · présence correcte, optimisations possibles.`;
}

export function getNeedLevel(hasWebsite: boolean, score?: number | null): { fr: string; en: string; tone: 'critical' | 'high' | 'medium' | 'low' } {
  const s = score || 0;
  if (!hasWebsite) return { fr: 'Besoin critique', en: 'Critical need', tone: 'critical' };
  if (s >= 7) return { fr: 'Fort besoin', en: 'High need', tone: 'high' };
  if (s >= 4) return { fr: 'Besoin modéré', en: 'Moderate need', tone: 'medium' };
  return { fr: 'Faible besoin', en: 'Low need', tone: 'low' };
}
