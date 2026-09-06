import { AppLayout } from '@/components/AppLayout';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12 space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-xs text-primary">
            <Shield className="w-3 h-3" /> Politique de confidentialité
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight">Politique de Confidentialité</h1>
          <p className="text-muted-foreground text-sm">Dernière mise à jour : 10 mars 2026</p>
        </motion.div>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-sm text-foreground">
          <section className="glass rounded-lg p-5 space-y-2">
            <h2 className="text-base font-bold">1. Introduction</h2>
            <p className="text-muted-foreground">Devora est un produit développé et détenu par <strong>Foapa Gianny Robert</strong>. Cette politique de confidentialité décrit comment nous collectons, utilisons et protégeons vos informations personnelles.</p>
          </section>
          <section className="glass rounded-lg p-5 space-y-2">
            <h2 className="text-base font-bold">2. Données collectées</h2>
            <ul className="text-muted-foreground space-y-1 list-disc list-inside">
              <li><strong>Données de compte :</strong> adresse email, nom (optionnel).</li>
              <li><strong>Données de géolocalisation :</strong> position GPS pour les scans, jamais stockée.</li>
              <li><strong>Données d'utilisation :</strong> scans, leads sauvegardés.</li>
              <li><strong>Données de paiement :</strong> numéro de téléphone mobile money, traité par CamPay ou Maviance.</li>
            </ul>
          </section>
          <section className="glass rounded-lg p-5 space-y-2">
            <h2 className="text-base font-bold">3. Utilisation des données</h2>
            <p className="text-muted-foreground">Vos données sont utilisées exclusivement pour :</p>
            <ul className="text-muted-foreground space-y-1 list-disc list-inside">
              <li>Fournir et améliorer le service Devora.</li>
              <li>Gérer votre compte et votre abonnement.</li>
              <li>Organiser vos prospects et votre pipeline commercial.</li>
              <li>Assurer la sécurité de la plateforme.</li>
            </ul>
          </section>
          <section className="glass rounded-lg p-5 space-y-2">
            <h2 className="text-base font-bold">4. Partage des données</h2>
            <p className="text-muted-foreground">Nous ne vendons ni ne partageons vos données, sauf :</p>
            <ul className="text-muted-foreground space-y-1 list-disc list-inside">
              <li><strong>Prestataires de paiement :</strong> traitement des transactions mobile money.</li>
              <li><strong>Obligations légales.</strong></li>
            </ul>
          </section>
          <section className="glass rounded-lg p-5 space-y-2">
            <h2 className="text-base font-bold">5. Sécurité</h2>
            <p className="text-muted-foreground">Chiffrement TLS, authentification sécurisée, RLS.</p>
          </section>
          <section className="glass rounded-lg p-5 space-y-2">
            <h2 className="text-base font-bold">6. Vos droits</h2>
            <ul className="text-muted-foreground space-y-1 list-disc list-inside">
              <li>Accéder, rectifier ou supprimer vos données.</li>
              <li>Retirer votre consentement.</li>
              <li>Exporter vos données.</li>
            </ul>
          </section>
          <section className="glass rounded-lg p-5 space-y-2">
            <h2 className="text-base font-bold">7. Cookies</h2>
            <p className="text-muted-foreground">Devora utilise uniquement des cookies techniques. Aucun tracking publicitaire.</p>
          </section>
          <section className="glass rounded-lg p-5 space-y-2">
            <h2 className="text-base font-bold">8. Contact</h2>
            <p className="text-muted-foreground">Contact : <strong>giannyfoapa@gmail.com</strong></p>
          </section>
        </div>
      </div>
    </AppLayout>
  );
}
