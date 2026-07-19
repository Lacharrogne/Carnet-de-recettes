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
2. Créez un **Produit** « Carnet de recettes — Premium » avec **deux variantes** :
   - **Mensuel** : 3,99 € / mois, abonnement, essai 14 jours (facultatif).
   - **Annuel** : 39,99 € / an, abonnement.
3. Pour chaque variante, récupérez le **lien de checkout** (bouton *Share* →
   *Buy link*), par ex. `https://VOTRE-STORE.lemonsqueezy.com/buy/xxxxxxxx`.
4. Notez aussi (Settings) le **Webhook signing secret** (étape 3).

## 2. Front — variables d'environnement

Ajoutez sur Vercel (et `.env.local` en local) :

```
VITE_LS_MONTHLY_URL=https://VOTRE-STORE.lemonsqueezy.com/buy/xxxxxxxx
VITE_LS_YEARLY_URL=https://VOTRE-STORE.lemonsqueezy.com/buy/yyyyyyyy
```

Dès qu'au moins un lien est présent, les boutons d'abonnement s'affichent
(`IS_BILLING_CONFIGURED`).

## 3. Supabase — base de données

Dans **Supabase → SQL Editor**, exécutez la migration :
`supabase/migrations/0003_subscriptions.sql`
(crée la table `subscriptions` + RLS : chacun lit sa ligne, seul le webhook écrit).

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

1. Activez le **Test mode** dans Lemon Squeezy (cartes de test).
2. Sur l'app, cliquez « S'abonner » → payez avec une carte de test.
3. Vérifiez dans Supabase que la ligne `subscriptions` du compte passe à
   `status = active`.
4. Rechargez l'app : l'accès premium doit être débloqué.

## 7. Activer le verrou (quand tout marche)

Dans `src/config/subscription.ts`, passez `ENFORCE_TRIAL` à `true`. À partir de
là, à la fin des 14 jours d'essai, l'app invite à s'abonner (les abonnés ne
sont pas bloqués).

---

## Ce que fait déjà le code livré
- `subscriptions` (SQL) + RLS.
- `supabase/functions/ls-webhook` : vérifie la signature HMAC et met à jour
  l'abonnement (statut, échéances, URL du portail client).
- `src/services/subscriptionService.ts` : lecture de l'abonnement +
  construction de l'URL de checkout (email + `user_id` en custom).
- `src/config/subscription.ts` : liens Lemon Squeezy via env + `IS_BILLING_CONFIGURED`.

## Étape suivante (à faire ensemble)
Une fois le webhook validé en test : brancher `useEntitlement` sur la table
`subscriptions`, ajouter l'**écran d'abonnement** (choix mensuel/annuel +
portail), puis activer le verrou. On réplique ensuite le même patron sur le
Carnet de recettes.
