/**
 * Réglages de l'essai gratuit et de l'abonnement du Carnet de recettes.
 *
 * Modèle : essai gratuit 14 jours (tout inclus), puis abonnement pour
 * continuer. Paiement via Lemon Squeezy (Merchant of Record). Tant que le
 * paiement n'est pas branché, on NE bloque personne : passer `ENFORCE_TRIAL`
 * à `true` le jour venu.
 */

/**
 * Identifiant de ce carnet dans le modèle d'abonnement par carnet.
 * Un abonnement débloque ce carnet si son `plan` vaut ce carnet ou `all`.
 */
export const CARNET = 'recettes'

/** Durée de l'essai gratuit, en jours (aligné sur la vitrine). */
export const TRIAL_DURATION_DAYS = 14

/**
 * Quand `false`, l'accès reste ouvert à tous même après l'essai. Passer à
 * `true` une fois le paiement en place pour verrouiller l'app à la fin de
 * l'essai (sauf abonnés).
 */
export const ENFORCE_TRIAL = true

/** Contact utilisé en repli tant qu'il n'y a pas de paiement configuré. */
export const CONTACT_EMAIL = 'maxi.charr@gmail.com'

/**
 * Hub d'abonnement de la suite « Les Carnets ». L'abonnement (souscription
 * ET gestion/résiliation) est centralisé sur la vitrine ; le carnet y
 * redirige. Le SSO fait que l'utilisateur y arrive déjà connecté.
 */
export const SUBSCRIPTION_HUB_URL = 'https://lescarnets.app/#hub'
