// Lightweight, per-device recommendation signal: which business categories the
// user engages with (viewing or saving), used to bias/highlight results and to
// power the Premium "Suggestions intelligentes" page. No backend needed.

const KEY = 'devora.category_interest';

type InterestMap = Record<string, number>;

function read(): InterestMap {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
}

function write(data: InterestMap) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // ignore (private browsing, storage full, etc.)
  }
}

export function recordInterest(categoryLabel: string, weight = 1) {
  if (!categoryLabel) return;
  const data = read();
  data[categoryLabel] = (data[categoryLabel] || 0) + weight;
  write(data);
}

export function getTopCategories(limit = 3): { category: string; score: number }[] {
  const data = read();
  return Object.entries(data)
    .map(([category, score]) => ({ category, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
