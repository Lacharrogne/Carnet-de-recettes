# Carnet de recettes — Site vitrine

Site vitrine **autonome** (séparé de l'application) qui présente le produit,
convainc le visiteur et le dirige vers l'inscription puis le paiement.

C'est un projet **indépendant** : il a sa propre configuration, ses propres
dépendances et son propre build. Il peut être déplacé dans son propre dépôt et
déployé sur son propre nom de domaine (ex. `www.carnet-de-recettes.fr`), tandis
que l'application vit ailleurs (ex. `app.carnet-de-recettes.fr`).

## Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS v4 (mêmes tokens « chalet premium » que l'application)
- lucide-react (icônes)

Aucune dépendance à Supabase ou à un backend : c'est une page 100 % statique.

## Démarrer en local

```bash
cd vitrine
npm install
npm run dev
```

Puis ouvrir l'URL affichée (par défaut http://localhost:5173).

## Construire pour la production

```bash
npm run build      # génère le dossier dist/
npm run preview    # prévisualise le build
```

Le dossier `dist/` est un site statique : déployable tel quel sur **Netlify**,
**Vercel**, **GitHub Pages**, **Cloudflare Pages**, OVH, etc.

## ⚙️ Configuration — le seul fichier à modifier

Tout est centralisé dans **`src/config.ts`** :

| Clé             | Rôle                                                            |
| --------------- | -------------------------------------------------------------- |
| `LINKS.APP_URL`      | Adresse de ton application (le carnet)                     |
| `LINKS.SIGNUP_URL`   | Page d'inscription / création de compte                   |
| `LINKS.LOGIN_URL`    | Page de connexion                                         |
| `LINKS.CHECKOUT_URL` | Page/site de paiement de l'abonnement Premium             |
| `LINKS.CONTACT_EMAIL`| Adresse de contact (pied de page)                         |
| `LINKS.PRIVACY_URL` / `TERMS_URL` / `LEGAL_URL` | Pages légales              |
| `PRICING`            | Prix et périodes affichés                                 |

### Le bouton « Premium »

- Tant que `CHECKOUT_URL` vaut `null` → le bouton affiche **« Bientôt disponible »**
  (désactivé).
- Dès que tu renseignes une URL → le bouton devient **« Passer au Premium »** et
  redirige vers ton site/page de paiement.

C'est ainsi que la vitrine reste « une porte d'entrée vers tes sites » :
l'inscription pointe vers l'app, le paiement vers ta page dédiée.

## Structure

```
vitrine/
├── index.html              # SEO / Open Graph / polices
├── src/
│   ├── config.ts           # 👈 URLs & tarifs (à éditer)
│   ├── index.css           # tokens de design (chalet premium)
│   ├── App.tsx             # assemblage des sections
│   └── components/
│       ├── Navbar.tsx
│       ├── Hero.tsx
│       ├── ProblemSolution.tsx
│       ├── Features.tsx
│       ├── Benefits.tsx
│       ├── HowItWorks.tsx
│       ├── Testimonials.tsx   # ⚠️ avis d'exemple à remplacer
│       ├── Pricing.tsx
│       ├── Faq.tsx
│       ├── FinalCta.tsx
│       └── Footer.tsx
└── public/                 # logo + favicon
```

## À personnaliser avant la mise en ligne

1. **`src/config.ts`** : mettre les vraies URLs et le bon email de contact.
2. **`Testimonials.tsx`** : remplacer les témoignages d'exemple par de vrais avis.
3. Pages légales (Confidentialité, CGU, Mentions) : créer les pages ou pointer
   les liens vers les bonnes adresses.
