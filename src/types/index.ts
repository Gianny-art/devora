export type Business = {
  id: string;
  name: string;
  address: string;
  city?: string;
  district?: string;
  phone?: string;
  email?: string;
  facebook?: string;
  instagram?: string;
  whatsapp?: string;
  openingHours?: string;
  rating?: number;
  website?: string;
  category: string;
  lat: number;
  lng: number;
  hasWebsite: boolean;
  opportunityScore?: number;
};

export type Lead = {
  id: string;
  business_id: string;
  user_id: string;
  status: 'new' | 'contacted' | 'interested' | 'proposal' | 'closed' | 'lost';
  notes: string;
  created_at: string;
  updated_at: string;
  business?: Business;
};

export type ScanResult = {
  id: string;
  user_id: string;
  lat: number;
  lng: number;
  radius: number;
  businesses: Business[];
  created_at: string;
};

export type PlanTier = 'free' | 'premium';

export const PLAN_FEATURES: Record<PlanTier, { name: string; price: string; amountXaf: number; features: string[]; scanScope: string; featuresFr: string[] }> = {
  free: {
    name: 'Free',
    price: '0 XAF',
    amountXaf: 0,
    features: ['2 scans (lifetime)', 'Business contact details', 'Map & list view', 'Lead CRM'],
    featuresFr: ['2 scans (à vie)', 'Coordonnées des entreprises', 'Vue carte & liste', 'CRM Leads'],
    scanScope: '0-10 km',
  },
  premium: {
    name: 'Premium',
    price: '5 000 XAF/mois',
    amountXaf: 5000,
    features: ['Everything in Free', 'Unlimited scans, worldwide', 'Business audit + WhatsApp outreach', 'Smart suggestions', 'Export scans (PDF/Excel)', 'Team collaboration', 'Priority support'],
    featuresFr: ['Tout Free inclus', 'Scans illimités, dans le monde entier', 'Audit entreprise + envoi WhatsApp', 'Suggestions intelligentes', 'Export des scans (PDF/Excel)', 'Collaboration en équipe', 'Support prioritaire'],
    scanScope: 'Monde entier',
  },
};
