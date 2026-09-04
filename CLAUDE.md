# Instructions de travail — Carnet de recettes 🍳

Ce fichier est lu automatiquement au début de chaque session. Il contient les
règles à respecter dans ce dépôt.

Contexte de l'écosystème : voir **`ARCHITECTURE.md`** dans le dépôt
[vitrine-carnet](https://github.com/Lacharrogne/vitrine-carnet) (socle Supabase
partagé, SSO, modèle d'abonnement, garde-fous communs).

---

## ⚠️ Règle n°1 — tenir la main courante

**Tout changement doit être consigné dans `CHANGELOG.md`, dans le même commit
que le changement lui-même.** Jamais après coup, jamais « plus tard ».

Cette main courante est la mémoire du projet : une session future (assistant ou
humain) n'aura pas le contexte de celle qui a fait le changement. Le message de
commit dit *ce qui* a changé ; le CHANGELOG dit *pourquoi*, et ce que ça
implique.

Format d'une entrée — ajouter en **haut** du fichier, sous la date du jour :

```markdown
## AAAA-MM-JJ

### Titre court de la modification (#numéro de PR)

- **Ce qui change** : la modification, en une ou deux phrases concrètes.
- **Pourquoi** : le problème constaté, ou la demande à l'origine.
- **À savoir** : conséquence, limite connue, ou piège à éviter ensuite.
  *(ligne facultative, mais précieuse)*
```

Règles d'écriture : en français, du point de vue de l'utilisateur quand c'est
possible, et **sans jamais mentionner un nom de modèle d'IA**.

---

## Garde-fous de ce dépôt

À respecter pour ne pas rouvrir des bugs déjà corrigés :

- **Aucun dialogue natif.** Zéro `window.confirm` / `prompt` / `alert` :
  utiliser le `DialogProvider` (`src/components/ui/DialogProvider.tsx`).
- **Grilles mobiles** : toujours des colonnes définies (`grid-cols-1`…), jamais
  un `grid` nu — sinon débordement horizontal et dézoom automatique sur mobile.
- **Stockage** : upsert + nettoyage ciblé, **jamais** « tout supprimer puis
  réinsérer » (ce motif a déjà causé des pertes de données).
- **Pas de colonne écrite sans migration** : un champ envoyé à Supabase doit
  exister en base.
- **PWA** : `beforeinstallprompt` se capte au chargement du module
  (`src/lib/installPrompt.ts`), jamais dans un `useEffect`.
- **Brouillons de formulaires** : conservés en `localStorage` (expiration 12 h).
- **Prix** : la seule source de vérité est `src/config.ts` du dépôt
  **vitrine-carnet**. Ne jamais réintroduire de config de prix ici.

---

## Méthode de travail

1. Développer sur une branche, jamais directement sur `main`.
2. **Vérifier que ça compile** avant de proposer quoi que ce soit :
   ```bash
   VITE_SUPABASE_URL="https://demo.supabase.co" VITE_SUPABASE_ANON_KEY="demo" npm run build
   ```
3. Mettre à jour `CHANGELOG.md` **dans le même commit**.
4. Ouvrir une PR, puis **vérifier chaque merge un par un** (ne pas supposer
   qu'un lot de PR est passé — cette erreur a déjà été commise).

## État connu

Les problèmes identifiés et non encore corrigés sont suivis dans les **issues
GitHub** de ce dépôt, et récapitulés dans le tableau de bord
[vitrine-carnet#10](https://github.com/Lacharrogne/vitrine-carnet/issues/10).
Consulter les issues ouvertes avant de proposer des améliorations : le socle
(SSO, paiement, entitlement) est **déjà construit et fonctionne**.
