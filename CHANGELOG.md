# Journal des changements — Carnet de recettes 🍳

Main courante du carnet : **ce qui a été fait, quand, et pourquoi**.
Ordre antéchronologique (le plus récent en haut).

> Chaque modification est consignée ici **dans le même commit** que le
> changement. Voir `CLAUDE.md` pour le format et la règle.
>
> Ce journal démarre le 2026-08-22 ; l'historique antérieur est dans `git log`.

---

## 2026-09-04

### Les erreurs rencontrées ne disparaissent plus dans le vide

- **Ce qui change** : les erreurs non rattrapées (plantage de rendu, promesse
  rejetée, erreur globale) sont remontées vers la table `client_errors` du
  socle. L'`ErrorBoundary`, qui écrivait jusqu'ici dans une console que
  personne ne lit, les signale désormais vraiment. La logique anti-inondation est couverte par 7 tests.
- **Pourquoi** : un incident chez un utilisateur n'était connu que s'il prenait
  la peine d'écrire — ou jamais.
- **À savoir** : actif **en production uniquement**. Trois garde-fous : la
  remontée n'échoue jamais bruyamment (un problème de journalisation ne doit
  pas devenir un problème d'application), les doublons et le débit sont
  plafonnés (un composant qui plante en boucle n'enverra qu'**une** erreur),
  et seul le **chemin** de la page est transmis — jamais les paramètres d'URL,
  qui peuvent contenir des jetons. Nécessite la migration `0020`.

### Lint nettoyé et rendu bloquant

- **Ce qui change** : les 7 erreurs de lint sont traitées — cinq en supprimant des états dérivés (amis, collections, auteurs se déduisent au lieu d'être vidés depuis un effet), une en lisant l'état initial de la bannière d'installation au lieu de le poser depuis un effet, une documentée comme exception. Le lint passe de « informatif » à **bloquant** en CI :
  une PR qui en réintroduit une ne peut plus être fusionnée.
- **Pourquoi** : ces erreurs `react-hooks` signalaient de vrais motifs fragiles
  (états dérivés stockés inutilement, ref écrite pendant le rendu). Et un lint
  qu'on ignore ne sert à rien.
- **À savoir** : les rares exceptions restantes sont **annotées avec leur
  justification** dans le code — restauration d'un brouillon qui dépend de
  données chargées après coup, et champ éditable qu'on ne peut pas dériver.

### Le planning de repas et l'historique suivent enfin votre compte

- **Ce qui change** : le planning de la semaine et l'historique « déjà
  cuisiné » sont désormais rattachés au compte. Rempli sur le téléphone, le
  planning apparaît sur l'ordinateur ; vider le cache du navigateur ne l'efface
  plus. L'affichage reste instantané : on écrit d'abord localement, la
  synchronisation suit.
- **Pourquoi** : le planning est une fonctionnalité **payante** qui ne tenait
  pas la promesse « un compte, partout » — et une donnée qui ne vivait que dans
  le navigateur pouvait disparaître sans recours.
- **À savoir** : à la première connexion, un planning déjà présent dans le
  navigateur est **poussé vers le compte** (rien n'est perdu) ; si le compte a
  déjà un planning, c'est lui qui fait foi. La synchronisation est **créneau par
  créneau** : deux appareils qui modifient des repas différents ne s'écrasent
  pas. Si la lecture du compte échoue, on ne pousse rien et on garde la copie
  locale, pour ne jamais effacer sur la foi d'une information incomplète.
  Nécessite la migration `0018` (dépôt vitrine).

### Un abonné payant ne peut plus être bloqué par une panne de lecture

- **Ce qui change** : `getSubscription()` distingue désormais **« lecture
  réussie »** de **« lecture en échec »** (au lieu de renvoyer `null` dans les
  deux cas) et réessaie deux fois avant d'abandonner. La décision d'accès passe
  par une fonction pure, `decideEntitlement()`, qui **laisse entrer** quand
  l'abonnement n'a pas pu être lu, et se rabat sur le dernier statut connu
  mémorisé localement. Couverte par 11 tests unitaires.
- **Pourquoi** : une simple coupure réseau suffisait à faire passer un client
  qui paie pour un non-abonné ; l'essai étant terminé, il se retrouvait devant
  l'écran « essai terminé », dehors.
- **À savoir** : principe retenu — **on ne verrouille jamais sur un doute**.
  L'entitlement expose un indicateur `degraded` quand la décision repose sur ce
  repli, pour permettre plus tard un bandeau discret plutôt qu'un mur.

### Intégration continue (CI)

- **Ce qui change** : ajout d'un workflow GitHub Actions qui, sur chaque PR et
  sur `main`, installe les dépendances, passe le lint, lance les tests et vérifie que le
  build compile. Un second job **refuse toute PR qui touche à `src/` ou
  `supabase/` sans mettre à jour `CHANGELOG.md`**.
- **Pourquoi** : aucun dépôt n'avait de CI — rien n'empêchait de fusionner une
  PR qui casse le build, et la main courante ne tenait que par la discipline.
- **À savoir** : le lint est **non bloquant** pour l'instant (`continue-on-error`),
  car il remonte des erreurs préexistantes. Le rendre bloquant une fois
  celles-ci corrigées, en retirant cette ligne du workflow.

### Mise en place de la main courante

- **Ce qui change** : ajout de ce `CHANGELOG.md` et d'un `CLAUDE.md` qui fixe
  les règles de travail du dépôt (dont l'obligation de tenir ce journal).
- **Pourquoi** : garder une trace précise des décisions, afin qu'une session
  future — sans le contexte de celle qui a fait le changement — sache ce qui a
  déjà été fait et pourquoi.

### Audit technique : ouverture des tickets

- **Ce qui change** : les constats de l'audit sont désormais suivis en issues
  (#27 entitlement, #28 planning non synchronisé, #29 CI et lint).
- **À savoir** : le socle (SSO, paiement, entitlement) est **déjà construit** —
  ne pas le proposer comme « à faire ». Voir le tableau de bord
  [vitrine-carnet#10](https://github.com/Lacharrogne/vitrine-carnet/issues/10).

## 2026-09-03

### Vrai README (#26)

- **Ce qui change** : le README d'exemple généré par Vite est remplacé par une
  vraie présentation du carnet (stack, démarrage, fonctionnalités, conventions).
- **Pourquoi** : le dépôt ne documentait rien de son propre contenu.

### Retrait de la config de paiement morte (#25)

- **Ce qui change** : suppression de `LEMONSQUEEZY`, `IS_BILLING_CONFIGURED` et
  `buildCheckoutUrl()`, qui n'étaient plus ni importés ni appelés.
- **Pourquoi** : ils portaient un **prix obsolète** (5,99 € au lieu de 3,99 €),
  alors que le checkout est centralisé sur le Hub de la vitrine.
- **À savoir** : la seule source de vérité des prix est `src/config.ts` du dépôt
  vitrine-carnet. Ne pas réintroduire de prix ici.

### L'invite d'installation ne s'affichait pas sur PC (#24)

- **Ce qui change** : `beforeinstallprompt` est désormais capté dès le
  chargement du module (`src/lib/installPrompt.ts`), et non plus dans un
  `useEffect`.
- **Pourquoi** : sur ordinateur, l'événement se déclenche **avant** le montage
  du composant React — le listener le ratait, et la bannière « Installer
  l'application » n'apparaissait jamais.

## 2026-09-01

### Fenêtres in-app à la place des boîtes natives (#23)

- **Ce qui change** : les `window.confirm` / `prompt` sont remplacés par un
  `DialogProvider` (fenêtres stylées, accessibles, basées sur des promesses).
- **Pourquoi** : les boîtes natives du navigateur étaient laides et cassaient
  l'identité visuelle du carnet.

## 2026-08-30 → 08-31

### Mobile : fin du scroll horizontal et du dézoom (#20, #21, #22)

- **Ce qui change** : `grid-cols-1` appliqué à toutes les grilles mono-colonne,
  notamment le planning et le menu Outils.
- **Pourquoi** : une grille sans colonnes définies laisse son contenu déborder
  (« grid blowout ») ; la page devenait plus large que l'écran et le navigateur
  dézoomait, rendant les éléments illisibles.
- **À savoir** : garde-fou permanent — ne jamais laisser un `grid` nu.

### Mobile : fondu en haut du menu ouvert (#19)

- **Ce qui change** : dégradé en haut du menu déroulant.
- **Pourquoi** : un bouton apparaissait coupé net sous l'en-tête.

## 2026-08-29

### Encoche et barre d'accueil iOS (#18)

- **Ce qui change** : `viewport-fit=cover` et prise en compte des `safe-area`.
- **Pourquoi** : l'en-tête et la barre du bas passaient sous l'encoche iPhone.

## 2026-08-28

### L'app devient installable (#17)

- **Ce qui change** : icônes 192/512 + maskable, `apple-touch-icon` opaque,
  raccourcis dans le manifest, bannière « Installer l'application ».
- **Pourquoi** : permettre d'ajouter le carnet à l'écran d'accueil comme une
  vraie application.

## 2026-08-27

### Mobile : le menu ouvert remplit l'écran (#16)

- **Pourquoi** : le contenu de la page débordait derrière le menu.

## 2026-08-23

### Pied de page aligné sur la suite (#15)

- **Ce qui change** : colonne « Les Carnets » et icônes emoji, identiques aux
  autres carnets.

## 2026-08-22

### Accueil connecté et améliorations recettes (#13, #14)

- **Ce qui change** : refonte premium de l'accueil connecté (deux colonnes,
  carte « On cuisine quoi ? », repas du jour, courses) ; suppression de
  brouillon, floutage de la nutrition sur les cartes, reconnaissance
  d'ingrédients élargie.
