export type Business = {
  id: string;
  name: string;
  address: string;
  phone?: string;
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

export type PlanTier = 'free' | 'premium' | 'premium_plus';

export const PLAN_FEATURES: Record<PlanTier, { name: string; price: string; amountXaf: number; features: string[]; scanScope: string; featuresFr: string[] }> = {
  free: {
    name: 'Free',
    price: '0 XAF',
    amountXaf: 0,
    features: ['Scan nearby businesses', 'Business contact details', 'Map & list view', 'Lead CRM', '2 scans/day'],
    featuresFr: ['Scanner les entreprises à proximité', 'Coordonnées des entreprises', 'Vue carte & liste', 'CRM Leads', '2 scans/jour'],
    scanScope: '0-10 km',
  },
  premium: {
    name: 'Premium',
    price: '5 000 XAF/mois',
    amountXaf: 5000,
    features: ['Everything in Free', 'Unlimited scans', 'Scan up to 50km', 'Team collaboration', 'Priority support'],
    featuresFr: ['Tout Free inclus', 'Scans illimités', 'Scan jusqu\'à 50km', 'Collaboration en équipe', 'Support prioritaire'],
    scanScope: '0-50 km',
  },
  premium_plus: {
    name: 'Premium Plus',
    price: '10 000 XAF/mois',
    amountXaf: 10000,
    features: ['Everything in Premium', 'Worldwide scanning', 'Unlimited team projects', 'API access'],
    featuresFr: ['Tout Premium inclus', 'Scan mondial illimité', 'Projets d\'équipe illimités', 'Accès API'],
    scanScope: 'Monde entier',
  },
};
