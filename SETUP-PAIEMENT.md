# Mise en place du paiement — Carnet de recettes (Lemon Squeezy)

Modèle : **essai gratuit 14 jours → abonnement** (mensuel 3,99 € / annuel 39,99 €),
**un abonnement par carnet**. Lemon Squeezy est **Merchant of Record** : il gère
la TVA et les factures à votre place.

Le code (migration, webhook, service front, config) est **déjà dans le dépôt**.
Il reste à créer le produit, brancher les clés et déployer. Tant que ce n'est
pas fait, **rien ne change** pour les utilisateurs (verrou `ENFORCE_TRIAL=false`).

---

## 1. Lemon Squeezy — créer le produit

1. Créez un compte sur https://lemonsqueezy.com et un **Store**.
2. Créez un **Produit** « Carnet de recettes — Premium », type **Abonnement**,
   avec **deux variantes** :
   - **Mensuel** : 3,99 € / mois.
   - **Annuel** : 39,99 € / an.
   ⚠️ **N'activez pas d'essai gratuit côté Lemon Squeezy** : l'app gère déjà
   les 14 jours (sans carte), sinon l'utilisateur cumulerait deux essais.
3. Pour chaque variante, récupérez le **lien de checkout** (bouton *Share* →
   isolez une seule variante → copiez le lien), par ex.
   `https://VOTRE-STORE.lemonsqueezy.com/checkout/buy/xxxx?enabled=yyyy`.
4. Notez aussi (Settings) le **Webhook signing secret** (étape 3).

> ⚠️ Les liens du **mode test** et du **mode live** sont différents. Validez
> d'abord tout le tunnel en test, puis régénérez les liens en live pour
> encaisser réellement.

## 2. Front — variables d'environnement

Ajoutez sur Vercel (et `.env.local` en local) :

```
VITE_LS_MONTHLY_URL=https://VOTRE-STORE.lemonsqueezy.com/buy/xxxxxxxx
VITE_LS_YEARLY_URL=https://VOTRE-STORE.lemonsqueezy.com/buy/yyyyyyyy
```

Dès qu'au moins un lien est présent, les boutons d'abonnement s'affichent
(`IS_BILLING_CONFIGURED`). Vérifiez le mapping : sur `/premium`, le bouton
**Mensuel** doit ouvrir un checkout à **3,99 €/mois** (sinon, intervertissez
les deux variables).

## 3. Supabase — base de données

Dans **Supabase → SQL Editor**, exécutez les deux migrations :
- `supabase/migrations/0003_subscriptions.sql` — table `subscriptions` + RLS
  (chacun lit sa ligne, seul le webhook écrit).
- `supabase/migrations/0004_comp_access.sql` — accès offerts (colonne `source`
  + fonctions admin `grant_comp_access` / `revoke_comp_access` /
  `list_comp_access`).

## 4. Supabase — Edge Function (webhook)

Avec le CLI Supabase, depuis la racine du dépôt :

```bash
supabase functions deploy ls-webhook --no-verify-jwt
supabase secrets set LEMONSQUEEZY_WEBHOOK_SECRET=le_secret_de_l_etape_1
```

`SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` sont fournis automatiquement à la
fonction — rien à faire pour eux.

## 5. Lemon Squeezy — brancher le webhook

Settings → Webhooks → *Add webhook* :
- **URL** : `https://<project-ref>.supabase.co/functions/v1/ls-webhook`
- **Signing secret** : le même qu'à l'étape 1 / 4.
- **Événements** : `subscription_created`, `subscription_updated`,
  `subscription_cancelled`, `subscription_expired`, `subscription_paused`,
  `subscription_unpaused`.

## 6. Tester (mode test Lemon Squeezy)

1. Activez le **Test mode** dans Lemon Squeezy (bandeau orange).
2. Sur `/premium`, cliquez « S'abonner » → payez avec une carte de test :
   - Numéro : `4242 4242 4242 4242`
   - Expiration : une date future (`12/34`) — CVC : `123`
3. Vérifiez dans Supabase que la ligne `subscriptions` du compte passe à
   `status = active` (`source = lemonsqueezy`).
4. Rechargez l'app : la page `/premium` doit afficher « Vous êtes abonné » et
   le bandeau d'essai disparaît.

En cas de souci, consultez les logs de la fonction :
`supabase functions logs ls-webhook` (401 « Invalid signature » = secret
manquant/incorrect ; « No user_id » = `custom_data` absent du checkout).

## 7. Activer le verrou (quand tout marche)

Dans `src/config/subscription.ts`, passez `ENFORCE_TRIAL` à `true`. À partir de
là, à la fin des 14 jours d'essai, l'app invite à s'abonner (les abonnés ne
sont pas bloqués).

---

## Accès offerts (sans paiement)

Depuis **/admin** (compte `role = 'admin'`), section « Accès offerts » :
saisir l'email d'un compte existant → **Offrir l'accès**. La personne est vue
comme abonnée (`status = active, source = 'comp'`), sans toucher aux
abonnements payants. « Retirer » annule l'accès offert.

## Ce que fait déjà le code livré
- `subscriptions` (SQL) + RLS + accès offerts (migrations 0003 & 0004).
- `supabase/functions/ls-webhook` : vérifie la signature HMAC et met à jour
  l'abonnement (statut, échéances, URL du portail client).
- `src/services/subscriptionService.ts` : lecture de l'abonnement +
  construction de l'URL de checkout (email + `user_id` en custom).
- `src/lib/useEntitlement.ts` : statut d'accès (abonné / essai / expiré).
- `src/pages/SubscriptionPage.tsx` : page `/premium` (cartes mensuel/annuel,
  portail client, états essai/abonné).
- `src/components/layout/TrialBanner.tsx` : bandeau d'essai (masquable).
- Lien « Abonnement » dans le menu profil de l'en-tête.
- `src/config/subscription.ts` : liens Lemon Squeezy via env + `IS_BILLING_CONFIGURED`.

## Passer en production (encaisser pour de vrai)
1. Compléter la **vérification d'identité** Lemon Squeezy (Settings → Général).
2. Basculer en **mode live**, créer/publier le produit en live.
3. Récupérer les **liens checkout live** → mettre à jour `VITE_LS_*` sur Vercel.
4. Créer le **webhook live** (même URL, son propre secret) →
   `supabase secrets set LEMONSQUEEZY_WEBHOOK_SECRET=...`.
5. Quand souhaité, passer `ENFORCE_TRIAL` à `true` pour verrouiller l'accès à
   la fin de l'essai, puis redéployer.
