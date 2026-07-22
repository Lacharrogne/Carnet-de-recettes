/**
 * Réglages de l'essai gratuit et de l'abonnement du Carnet de recettes.
 *
 * Modèle : essai gratuit 14 jours (tout inclus), puis abonnement pour
 * continuer. Paiement via Lemon Squeezy (Merchant of Record). Tant que le
 * paiement n'est pas branché, on NE bloque personne : passer `ENFORCE_TRIAL`
 * à `true` le jour venu.
 */

/** Durée de l'essai gratuit, en jours (aligné sur la vitrine). */
export const TRIAL_DURATION_DAYS = 14

/**
 * Quand `false`, l'accès reste ouvert à tous même après l'essai. Passer à
 * `true` une fois le paiement en place pour verrouiller l'app à la fin de
 * l'essai (sauf abonnés).
 */
export const ENFORCE_TRIAL = false

/** Contact utilisé en repli tant qu'il n'y a pas de paiement configuré. */
export const CONTACT_EMAIL = 'maxi.charr@gmail.com'

/**
 * Hub d'abonnement de la suite « Les Carnets ». L'abonnement (souscription
 * ET gestion/résiliation) est centralisé sur la vitrine ; le carnet y
 * redirige. Le SSO fait que l'utilisateur y arrive déjà connecté.
 */
export const SUBSCRIPTION_HUB_URL = 'https://lescarnets.app/#tarifs'

/**
 * Liens de paiement Lemon Squeezy (checkout hébergé), via les variables
 * d'environnement Vite. Laisser vide tant que le produit n'existe pas : la
 * page d'abonnement affiche alors « bientôt ».
 *
 * - VITE_LS_MONTHLY_URL : lien « Buy » de la variante mensuelle (3,99 €).
 * - VITE_LS_YEARLY_URL  : lien « Buy » de la variante annuelle (39,99 €).
 */
export const LEMONSQUEEZY = {
  monthlyUrl: (import.meta.env.VITE_LS_MONTHLY_URL as string | undefined) ?? '',
  yearlyUrl: (import.meta.env.VITE_LS_YEARLY_URL as string | undefined) ?? '',
  // Offre unique « Les Carnets » : un seul abonnement débloque tous les carnets.
  monthlyPrice: '5,99 €',
  yearlyPrice: '59,99 €',
}

/** Le paiement est-il configuré (au moins un lien de checkout présent) ? */
export const IS_BILLING_CONFIGURED =
  LEMONSQUEEZY.monthlyUrl !== '' || LEMONSQUEEZY.yearlyUrl !== ''
