/**
 * Liens transverses de l'écosystème « Les Carnets ».
 *
 * Toute la partie commerciale (offre, abonnement, paiement) est gérée par la
 * VITRINE, pas dans l'application. Les boutons « Premium / Tarifs » de l'app
 * renvoient donc vers cette vitrine.
 *
 * 👉 Mettez ici l'adresse réelle de votre vitrine une fois le domaine connu
 *    (ex. https://les-carnets.fr). Par défaut : l'URL Vercel du projet vitrine.
 */
export const VITRINE_URL = 'https://vitrine-carnet.vercel.app'

/** Lien direct vers la section tarifs/offre de la vitrine. */
export const VITRINE_PRICING_URL = `${VITRINE_URL}/#tarifs`
