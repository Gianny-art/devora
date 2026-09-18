import { motion } from 'framer-motion';
import { AppLayout } from '@/components/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import {
  Radar, Globe, Handshake, BarChart3, Users, FileText, ArrowRight,
  Search, MousePointer, Download, ExternalLink,
} from 'lucide-react';

const steps = [
  { icon: Search, title: '1. Lancez un scan', desc: "Rendez-vous sur la page Scanner, choisissez un rayon et cliquez sur \"Scanner\". Devora détecte les entreprises autour de vous." },
  { icon: MousePointer, title: '2. Explorez les résultats', desc: "Parcourez la liste ou la carte. Chaque fiche indique si l'entreprise a un site web et son score d'opportunité." },
  { icon: Users, title: '3. Sauvegardez vos leads', desc: "Cliquez sur une entreprise puis \"Sauvegarder\" pour l'ajouter à votre CRM de prospection." },
  { icon: BarChart3, title: '4. Suivez votre pipeline', desc: "Organisez vos leads par statut : nouveau, contacté, intéressé, proposition, conclu." },
  { icon: Handshake, title: '5. Collaborez en équipe', desc: "Créez un projet, invitez des collègues et partagez vos meilleures opportunités." },
  { icon: Download, title: "6. Installez l'app", desc: "Sur mobile, ouvrez Devora dans Chrome/Safari, puis \"Ajouter à l'écran d'accueil\"." },
];

const features = [
  { icon: Radar, label: 'Scan de proximité intelligent' },
  { icon: Globe, label: 'Carte interactive des commerces' },
  { icon: BarChart3, label: "Score d'opportunité" },
  { icon: Users, label: 'CRM de leads intégré' },
  { icon: Handshake, label: 'Collaboration en équipe' },
  { icon: FileText, label: 'Suivi et notes de prospection' },
];

export default function AboutPage() {
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-16">
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-xs text-primary">
            <Radar className="w-3 h-3" /> À propos de Devora
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
            Trouvez des clients.<br /><span className="text-gradient">Automatiquement.</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
            Devora scanne les entreprises locales, identifie celles qui manquent
            d'identité numérique, et vous aide à organiser vos prospects dans un CRM dédié.
          </p>
        </motion.section>

        <section>
          <h2 className="text-xl sm:text-2xl font-bold text-center mb-6">Fonctionnalités</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {features.map((f, i) => (
              <motion.div key={f.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="glass rounded-lg p-4 flex flex-col items-center text-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><f.icon className="w-5 h-5 text-primary" /></div>
                <span className="text-xs sm:text-sm font-medium">{f.label}</span>
              </motion.div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl sm:text-2xl font-bold text-center mb-2">Comment utiliser Devora</h2>
          <p className="text-muted-foreground text-center text-sm mb-8">Guide étape par étape</p>
          <div className="space-y-4">
            {steps.map((step, i) => (
              <motion.div key={step.title} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="glass rounded-lg p-4 sm:p-5 flex gap-4 items-start">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><step.icon className="w-5 h-5 text-primary" /></div>
                <div>
                  <h3 className="font-semibold text-sm sm:text-base mb-1">{step.title}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="glass rounded-2xl p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center shrink-0">
              <span className="text-3xl sm:text-4xl font-black text-primary">FG</span>
            </div>
            <div className="text-center sm:text-left space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold">Foapa Gianny Robert</h2>
              <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">Web Developer</Badge>
                <Badge variant="outline" className="text-[10px] border-accent/30 text-accent">Software Engineer</Badge>
                <Badge variant="outline" className="text-[10px] border-warning/30 text-warning">Entrepreneur</Badge>
              </div>
              <p className="text-sm text-muted-foreground max-w-lg">
                Développeur web et ingénieur logiciel basé à Yaoundé, Cameroun. Fondateur de Devora,
                un outil conçu pour aider les développeurs et agences web à trouver des clients locaux.
              </p>
              <div className="flex flex-wrap justify-center sm:justify-start gap-2 pt-1">
                <a href="https://about.me/foapa" target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5"><ExternalLink className="w-3 h-3" /> about.me</Button>
                </a>
                <a href="https://giannyporto-folio.netlify.app/" target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5"><Globe className="w-3 h-3" /> Portfolio</Button>
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="text-center gradient-radar rounded-2xl p-8 border border-primary/20">
          <h2 className="text-xl sm:text-2xl font-bold mb-3">Prêt à trouver vos prochains clients ?</h2>
          <p className="text-muted-foreground text-sm mb-5">Commencez gratuitement — aucune carte bancaire requise.</p>
          <Link to="/scan"><Button variant="scanner" size="lg" className="gap-2"><Radar className="w-4 h-4" /> Lancer un Scan <ArrowRight className="w-4 h-4" /></Button></Link>
        </section>

        <div className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground pb-4">
          <Link to="/privacy" className="hover:text-primary transition-colors">Politique de confidentialité</Link>
          <Link to="/legal" className="hover:text-primary transition-colors">Mentions légales & CGU</Link>
          <span>© 2025-{new Date().getFullYear()} Devora · Foapa Gianny Robert</span>
        </div>
      </div>
    </AppLayout>
  );
}
