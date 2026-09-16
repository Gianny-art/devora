import { Business } from '@/types';

export type AuditResult = {
  score: number; // 0-10 digital presence score, deterministic (not AI)
  problems: string[];
  recommendations: string[];
  pitch: string; // ready-to-send WhatsApp outreach message
};

const hasSocial = (b: Business) => !!(b.facebook || b.instagram || b.whatsapp);

function computeScore(b: Business): number {
  let score = 0;
  if (b.hasWebsite) score += 4;
  if (b.email) score += 2;
  if (b.phone) score += 2;
  if (hasSocial(b)) score += 1;
  if (b.openingHours) score += 1;
  return Math.min(10, score);
}

export function generateAudit(b: Business, lang: 'fr' | 'en' = 'fr'): AuditResult {
  const score = computeScore(b);
  const problems: string[] = [];
  const recommendations: string[] = [];

  if (lang === 'en') {
    if (!b.hasWebsite) {
      problems.push('No website found — potential customers searching online can\'t find this business.');
      recommendations.push('Build a simple, professional website to appear on Google Maps and search results.');
    }
    if (!b.email) {
      problems.push('No professional email listed — makes the business harder to trust and contact for quotes.');
      recommendations.push('Set up a professional email address (e.g. contact@business.com).');
    }
    if (!hasSocial(b)) {
      problems.push('No social media presence detected (Facebook, Instagram, WhatsApp Business).');
      recommendations.push('Create a Facebook/Instagram page to reach local customers daily.');
    }
    if (!b.phone) {
      problems.push('No phone number listed — customers can\'t call to ask questions or book.');
      recommendations.push('Publish a clear contact number across all listings.');
    }
    if (problems.length === 0) {
      problems.push('Digital presence looks reasonably complete based on available data.');
      recommendations.push('Focus on SEO and content to stand out from competitors.');
    }
  } else {
    if (!b.hasWebsite) {
      problems.push('Aucun site web trouvé — les clients qui cherchent en ligne ne trouvent pas cette entreprise.');
      recommendations.push('Créer un site vitrine simple et professionnel pour apparaître sur Google et Google Maps.');
    }
    if (!b.email) {
      problems.push('Aucune adresse email professionnelle — moins de confiance pour les demandes de devis.');
      recommendations.push('Mettre en place une adresse email professionnelle (ex: contact@entreprise.com).');
    }
    if (!hasSocial(b)) {
      problems.push('Aucune présence détectée sur les réseaux sociaux (Facebook, Instagram, WhatsApp Business).');
      recommendations.push('Créer une page Facebook/Instagram pour toucher les clients du quartier au quotidien.');
    }
    if (!b.phone) {
      problems.push('Aucun numéro de téléphone affiché — les clients ne peuvent pas appeler pour se renseigner.');
      recommendations.push('Afficher un numéro de contact clair sur toutes les plateformes.');
    }
    if (problems.length === 0) {
      problems.push('La présence numérique semble déjà correcte d\'après les données disponibles.');
      recommendations.push('Travailler le référencement (SEO) et le contenu pour se démarquer de la concurrence.');
    }
  }

  const pitch = generatePitch(b, problems, lang);
  return { score, problems, recommendations, pitch };
}

function generatePitch(b: Business, problems: string[], lang: 'fr' | 'en'): string {
  const topIssues = problems.slice(0, 2);
  if (lang === 'en') {
    return `Hello ${b.name} 👋\n\nI came across your business (${b.category}) while researching local companies, and noticed a couple of things that might be costing you customers:\n\n${topIssues.map(p => `• ${p}`).join('\n')}\n\nI help local businesses build a professional online presence. Would you be open to a quick chat about it?`;
  }
  return `Bonjour ${b.name} 👋\n\nEn faisant des recherches sur les entreprises locales, je suis tombé sur la vôtre (${b.category}) et j'ai remarqué quelques points qui pourraient vous faire perdre des clients :\n\n${topIssues.map(p => `• ${p}`).join('\n')}\n\nJ'accompagne les entreprises locales dans la mise en place d'une présence en ligne professionnelle. Seriez-vous disponible pour en discuter rapidement ?`;
}

/** Best available phone-like contact to reach the business on WhatsApp. */
export function getWhatsappTarget(b: Business): string | null {
  const raw = b.whatsapp || b.phone;
  if (!raw) return null;
  const digits = raw.replace(/[^\d+]/g, '').replace(/^00/, '+');
  return digits.replace(/^\+?/, '');
}

export function buildWhatsappUrl(b: Business, audit: AuditResult): string | null {
  const target = getWhatsappTarget(b);
  const text = encodeURIComponent(audit.pitch);
  if (target) return `https://wa.me/${target}?text=${text}`;
  return `https://wa.me/?text=${text}`;
}
