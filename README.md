# Devora

Devora scanne les entreprises locales, identifie celles qui n'ont pas de site web (ou un site de mauvaise qualité), et aide les développeurs/agences à organiser ces prospects dans un CRM de leads intégré, avec collaboration d'équipe.

Application développée par Foapa Gianny Robert.

## Stack

- React + Vite + TypeScript + Tailwind + shadcn/ui
- Supabase (auth, base de données, edge functions)
- Geoapify Places API pour la découverte d'entreprises
- CamPay / Maviance pour les paiements mobile money (Cameroun)

## Développement local

```sh
npm install
npm run dev
```

Copiez `.env.example` en `.env` et renseignez vos identifiants Supabase.

## Configuration Supabase

Secrets à définir sur le projet Supabase (Project Settings → Edge Functions → Secrets) :

- `GEOAPIFY_API_KEY` — clé API Geoapify (gratuite sur geoapify.com), utilisée par la fonction `discover-businesses`.
- `CAMPAY_USERNAME`, `CAMPAY_PASSWORD`, `CAMPAY_BASE_URL` (optionnel, défaut `https://demo.campay.net`) — identifiants CamPay.
- `MAVIANCE_BASE_URL`, `MAVIANCE_API_KEY` — identifiants Maviance.
- `CAMPAY_WEBHOOK_SECRET`, `MAVIANCE_WEBHOOK_SECRET` (optionnel mais recommandé) — secret partagé vérifié sur les webhooks de confirmation de paiement.

Déployer les fonctions et migrations :

```sh
npx supabase link --project-ref <votre-project-ref>
npx supabase db push
npx supabase functions deploy discover-businesses check-subscription create-payment campay-webhook maviance-webhook daily-notifications
```

## Application desktop (Electron)

```sh
npm run electron:build
```

Produit un dossier `release/win-unpacked/` contenant `Devora.exe` (exécutable autonome, à archiver/distribuer en zip).

## Application Android (Capacitor)

Le projet Android est scaffoldé dans `android/`. La compilation d'un APK nécessite Android SDK + JDK :

```sh
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
```

Un workflow GitHub Actions (`.github/workflows/build-android.yml`) compile automatiquement l'APK à chaque push sur `main` et le publie en artifact téléchargeable, sans nécessiter d'installation locale d'Android Studio.
