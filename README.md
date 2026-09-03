# 🍳 Carnet de recettes

Votre cuisine, enfin organisée : réunissez vos recettes, planifiez vos repas et
préparez vos courses — dans un seul carnet, simple et chaleureux.

Fait partie de l'écosystème **[Les Carnets](https://lescarnets.app)** (un seul
compte, un seul abonnement débloque tous les carnets). Identité : terracotta,
thème clair.

> Déployé sur **recettes.lescarnets.app**.

## Stack

- **React 19** + **TypeScript** + **Vite**
- **Tailwind CSS v4** (tokens `@theme` maison — terracotta / crème / bark)
- **Supabase** (Postgres + Auth + Storage), backend central partagé « Les Carnets »
- **react-router-dom**, **lucide-react**
- **Vitest** pour la logique pure · **@vercel/analytics** + **speed-insights**

## Démarrer en local

```bash
npm install
npm run dev
```

Variables d'environnement requises (fichier `.env.local`) :

```bash
VITE_SUPABASE_URL=...        # projet Supabase « Les Carnets »
VITE_SUPABASE_ANON_KEY=...
```

```bash
npm run build     # tsc -b && vite build
npm run test      # vitest run
npm run lint
```

## Fonctionnalités

**Gratuit / public**
- Bibliothèque de recettes + fiche détaillée
- Recherche & filtres par régime (heuristique)
- Import d'une recette depuis une URL
- Avis (avec photo), badges, profils publics, suivi, réseau social
- Idées du site, page Outils

**Réservé aux abonnés (routes premium)**
- Ajouter / éditer une recette · Mes recettes · Favoris · Collections
- Frigo (matching d'ingrédients) · Liste de courses par rayon · Planning de la semaine

**Moteurs 100 % locaux (gratuits, sans API)**
- Estimation **nutrition + coût** d'une recette
- **Agrégation des courses** par rayon (parsing quantités/unités)
- **Batch cooking**, **matching frigo**, **recommandations « pour toi »**
- Mise à l'échelle des portions, minuteurs d'étapes + wake lock
- Historique « déjà cuisiné », fiches imprimables

## Accès & abonnement

- Essai gratuit **14 jours** (calculé depuis la création du compte), puis
  abonnement requis. Verrou piloté par `ENFORCE_TRIAL` dans
  `src/config/subscription.ts` (actuellement `true`).
- L'accès est résolu par `EntitlementProvider` à partir de la table partagée
  `subscriptions`. La **souscription et la gestion** sont centralisées sur le
  Hub de la vitrine (`lescarnets.app/#hub`) ; ce carnet ne fait qu'y rediriger.
- **Une seule source de vérité pour les prix : la vitrine.** Ne pas recréer de
  config de prix locale ici.

## Conventions du dépôt

- **Pas de dialogues natifs** : utiliser le `DialogProvider`
  (`confirm`/`prompt`/`alert` stylés, accessibles), jamais `window.confirm`.
- **Grilles mobiles** : toujours des colonnes définies (`grid-cols-1`…), jamais
  un `grid` nu — sous peine de débordement horizontal et de dézoom sur mobile.
- **Brouillons de formulaires** persistés en `localStorage` (expiration 12 h),
  mini-formulaires compris.
- **PWA** : l'événement `beforeinstallprompt` est capté au chargement du module
  (`src/lib/installPrompt.ts`), pas dans un `useEffect`.

## Base de données

Migrations locales dans `supabase/migrations/` (RLS, sécurité du storage,
abonnements, accès offerts, administration). Le **socle central** (identité,
facturation, schémas de tous les carnets) est versionné dans le dépôt
**vitrine-carnet**.

## Écosystème

📔 Vue d'ensemble de l'architecture partagée, du modèle d'accès et des
garde-fous communs : **`ARCHITECTURE.md`** dans le dépôt
[vitrine-carnet](https://github.com/Lacharrogne/vitrine-carnet).
