import { AppLayout } from '@/components/AppLayout';
import { motion } from 'framer-motion';
import { FileText, Scale, Shield, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

function generateNdaText(): string {
  return `ACCORD DE NON-DIVULGATION (NDA)
${'═'.repeat(50)}

Date : ${new Date().toLocaleDateString('fr-FR')}
Projet : Devora
Propriétaire : Foapa Gianny Robert
Localisation : Yaoundé, Cameroun
Contact : giannyfoapa@gmail.com

${'─'.repeat(50)}

ARTICLE 1 — OBJET

Le présent accord de non-divulgation (ci-après « NDA ») a pour objet de protéger les informations confidentielles relatives au projet Devora, un logiciel de détection d'entreprises et de gestion de prospects développé par Foapa Gianny Robert (ci-après « le Propriétaire »).

ARTICLE 2 — INFORMATIONS CONFIDENTIELLES

Sont considérées comme confidentielles toutes les informations relatives à :
- Le code source, les algorithmes et l'architecture technique de Devora
- Les méthodes de scan et d'évaluation des opportunités
- Les stratégies commerciales et les données utilisateurs
- Les plans de développement et roadmaps produit
- Tout document, maquette, prototype ou version non publiée

ARTICLE 3 — OBLIGATIONS

Le destinataire de ces informations s'engage à :
a) Ne pas divulguer, copier, reproduire ou partager les informations confidentielles
b) Ne pas utiliser les informations à des fins personnelles ou commerciales
c) Prendre toutes les mesures nécessaires pour protéger la confidentialité
d) Ne pas effectuer de reverse engineering sur le logiciel
e) Restituer ou détruire les informations sur demande du Propriétaire

ARTICLE 4 — DURÉE

Le présent NDA est valable pour une durée indéterminée à compter de la date d'accès aux informations confidentielles. L'obligation de confidentialité survit à la résiliation de tout accord entre les parties.

ARTICLE 5 — PROPRIÉTÉ INTELLECTUELLE

Tous les droits de propriété intellectuelle relatifs à Devora, y compris mais sans s'y limiter le code source, le design, les algorithmes, le nom « Devora » et le logo, sont et demeurent la propriété exclusive de Foapa Gianny Robert.

ARTICLE 6 — VIOLATION

Toute violation du présent NDA pourra entraîner :
- Des poursuites judiciaires devant les juridictions compétentes de Yaoundé, Cameroun
- Le versement de dommages-intérêts
- Toute autre mesure légale appropriée

ARTICLE 7 — DROIT APPLICABLE

Le présent NDA est régi par le droit en vigueur au Cameroun.

${'─'.repeat(50)}

Propriétaire : Foapa Gianny Robert
Signature : ____________________________
Date : ${new Date().toLocaleDateString('fr-FR')}

Destinataire :
Nom : ____________________________
Signature : ____________________________
Date : ____________________________

${'─'.repeat(50)}
© 2025-${new Date().getFullYear()} Devora — Tous droits réservés.
Créé et développé par Foapa Gianny Robert.
`;
}

function downloadNda() {
  const text = generateNdaText();
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'NDA_Devora_Foapa_Gianny_Robert.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function LegalPage() {
  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12 space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-xs text-primary">
            <Scale className="w-3 h-3" /> Mentions Légales
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight">Mentions Légales & CGU</h1>
          <p className="text-muted-foreground text-sm">Dernière mise à jour : 10 mars 2026</p>
        </motion.div>

        <div className="space-y-6 text-sm">
          <section className="glass rounded-lg p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <h2 className="text-base font-bold">Propriété intellectuelle & Fondateur</h2>
            </div>
            <div className="text-muted-foreground space-y-2">
              <p><strong>Devora</strong> est un logiciel SaaS créé, développé et détenu en totalité par :</p>
              <div className="bg-secondary/50 rounded-lg p-4 border border-border/50">
                <p className="font-semibold text-foreground">Foapa Gianny Robert</p>
                <p>Fondateur & Développeur principal</p>
                <p>Yaoundé, Cameroun</p>
                <p>Email : giannyfoapa@gmail.com</p>
                <p className="mt-2 text-xs">Date de création du projet : 2025</p>
              </div>
              <p>Tous les droits de propriété intellectuelle relatifs au code source, au design, aux algorithmes, au nom « Devora », au logo et à tout contenu associé sont la propriété exclusive de Foapa Gianny Robert.</p>
            </div>
          </section>

          <section className="glass rounded-lg p-5 space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              <h2 className="text-base font-bold">Conditions Générales d'Utilisation</h2>
            </div>
            <div className="text-muted-foreground space-y-2">
              <h3 className="font-semibold text-foreground text-sm">1. Objet</h3>
              <p>Les présentes CGU régissent l'utilisation de la plateforme Devora.</p>
              <h3 className="font-semibold text-foreground text-sm">2. Description du service</h3>
              <p>Devora permet de scanner des entreprises locales, d'identifier celles sans site web, et d'organiser vos prospects dans un CRM dédié.</p>
              <h3 className="font-semibold text-foreground text-sm">3. Inscription</h3>
              <p>L'inscription nécessite une adresse email valide.</p>
              <h3 className="font-semibold text-foreground text-sm">4. Plans et paiement</h3>
              <p>Devora propose un plan gratuit et des plans payants. Paiements via Mobile Money (CamPay, Maviance).</p>
              <h3 className="font-semibold text-foreground text-sm">5. Utilisation acceptable</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Ne pas utiliser le service à des fins illégales.</li>
                <li>Ne pas contourner les limitations de votre plan.</li>
                <li>Ne pas effectuer de reverse engineering.</li>
              </ul>
              <h3 className="font-semibold text-foreground text-sm">6. Limitation de responsabilité</h3>
              <p>Devora est fourni « tel quel ». Les données affichées (commerces, coordonnées) proviennent de sources ouvertes et peuvent être incomplètes.</p>
              <h3 className="font-semibold text-foreground text-sm">7. Droit applicable</h3>
              <p>Droit en vigueur au Cameroun. Juridictions de Yaoundé.</p>
            </div>
          </section>

          <section className="glass rounded-lg p-5 space-y-3 border border-primary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-primary" />
                <h2 className="text-base font-bold">Clause de Non-Divulgation (NDA)</h2>
              </div>
              <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={downloadNda}>
                <Download className="w-3 h-3" /> Télécharger NDA
              </Button>
            </div>
            <div className="text-muted-foreground space-y-2">
              <p>En accédant à Devora, vous reconnaissez et acceptez que :</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Le code source, les algorithmes et les méthodes techniques sont des <strong>informations confidentielles</strong> de Foapa Gianny Robert.</li>
                <li>Vous vous engagez à ne pas divulguer, copier ou partager aucune partie du code source ou de l'architecture technique.</li>
                <li>Toute violation pourra entraîner des poursuites judiciaires.</li>
                <li>Cette obligation survit à la résiliation de votre compte.</li>
              </ul>
            </div>
          </section>

          <div className="text-center text-xs text-muted-foreground pt-4 border-t border-border/50">
            <p>© 2025-{new Date().getFullYear()} Devora — Tous droits réservés.</p>
            <p>Créé et développé par Foapa Gianny Robert.</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
