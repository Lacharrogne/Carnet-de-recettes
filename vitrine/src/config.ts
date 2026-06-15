/**
 * ──────────────────────────────────────────────────────────────────────────
 *  CONFIGURATION DE LA VITRINE
 * ──────────────────────────────────────────────────────────────────────────
 *
 *  C'est le SEUL fichier à modifier pour brancher la vitrine sur tes sites.
 *  Tous les boutons et liens de la page lisent leurs URLs ici.
 *
 *  👉 Remplace les valeurs ci-dessous par tes vraies adresses quand elles
 *     seront prêtes.
 */

export const BRAND = {
  name: 'Carnet de recettes',
  tagline: 'Cuisine maison & petits plats',
  logo: '/logo.png',
}

/**
 * URLs externes.
 *
 * - APP_URL       : l'adresse de ton application (le carnet lui-même).
 * - SIGNUP_URL    : page d'inscription / création de compte.
 * - LOGIN_URL     : page de connexion.
 * - CHECKOUT_URL  : page/site de paiement de l'abonnement Premium.
 *                   Tant qu'elle n'est pas prête, laisse `null` :
 *                   le bouton Premium affichera « Bientôt disponible ».
 */
export const LINKS = {
  APP_URL: 'https://app.exemple.com',
  SIGNUP_URL: 'https://app.exemple.com/auth',
  LOGIN_URL: 'https://app.exemple.com/auth',
  CHECKOUT_URL: null as string | null,

  // Liens du pied de page (mets à jour ou laisse vide)
  CONTACT_EMAIL: 'contact@exemple.com',
  PRIVACY_URL: '#',
  TERMS_URL: '#',
  LEGAL_URL: '#',
}

/**
 * Tarifs affichés. Modifie librement le prix et la période.
 */
export const PRICING = {
  free: {
    price: '0 €',
    period: '/ pour toujours',
  },
  premium: {
    priceMonthly: '3,99 €',
    periodMonthly: '/ mois',
    priceYearly: '39,99 €',
    periodYearly: '/ an',
    yearlySavings: '2 mois offerts',
  },
}
