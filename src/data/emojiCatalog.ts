/**
 * Catalogue d'emojis du Carnet de recettes.
 *
 * Regroupé par thèmes de cuisine (fruits, légumes, plats, desserts...) pour
 * alimenter le sélecteur `EmojiPicker`. Chaque catégorie porte un libellé
 * (recherchable) et la liste de ses emojis. Le `keywords` optionnel enrichit
 * la recherche pour les emojis dont le sens n'est pas évident d'après le seul
 * libellé de catégorie.
 */

export interface EmojiCategory {
  /** Libellé affiché et utilisé pour la recherche. */
  label: string
  /** Emojis de la catégorie. */
  emojis: string[]
}

export const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    label: 'Plats & repas',
    emojis: [
      '🍽️', '🍲', '🥘', '🍛', '🍜', '🍝', '🍕', '🌮',
      '🌯', '🥙', '🥪', '🍔', '🌭', '🥟', '🍣', '🍱',
      '🥗', '🧆', '🫕', '🍳',
    ],
  },
  {
    label: 'Fruits',
    emojis: [
      '🍎', '🍏', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇',
      '🍓', '🫐', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝',
      '🍅', '🫒',
    ],
  },
  {
    label: 'Légumes',
    emojis: [
      '🥕', '🌽', '🥔', '🍠', '🧅', '🧄', '🥦', '🥬',
      '🥒', '🌶️', '🫑', '🍆', '🥑', '🍄', '🫛', '🥗',
    ],
  },
  {
    label: 'Viandes & poissons',
    emojis: [
      '🍗', '🍖', '🥩', '🥓', '🍤', '🦐', '🦀', '🦑',
      '🐟', '🐠', '🦞', '🍳', '🥚', '🧆',
    ],
  },
  {
    label: 'Pains & féculents',
    emojis: [
      '🍞', '🥖', '🥐', '🥯', '🫓', '🥨', '🍚', '🍝',
      '🥔', '🌾', '🧇',
    ],
  },
  {
    label: 'Desserts & sucré',
    emojis: [
      '🍰', '🎂', '🧁', '🍮', '🍩', '🍪', '🍫', '🍬',
      '🍭', '🍯', '🥧', '🍨', '🍦', '🍧', '🫖',
    ],
  },
  {
    label: 'Boissons',
    emojis: [
      '☕', '🍵', '🧃', '🥤', '🧋', '🍶', '🍷', '🥂',
      '🍺', '🍹', '🧉', '🥛', '💧',
    ],
  },
  {
    label: 'Petit-déjeuner',
    emojis: [
      '🥞', '🧇', '🍳', '🥓', '🥐', '🥯', '🧈', '🍞',
      '🥣', '☕', '🥛', '🍯',
    ],
  },
  {
    label: 'Épices & condiments',
    emojis: [
      '🧂', '🌿', '🍃', '🌶️', '🧄', '🧅', '🫚', '🍯',
      '🫙', '🧈', '🫒',
    ],
  },
  {
    label: 'Ustensiles & cuisine',
    emojis: [
      '🍴', '🥄', '🔪', '🍳', '🥣', '🥡', '🫕', '⏲️',
      '🧑‍🍳', '👨‍🍳', '👩‍🍳', '🔥', '❄️',
    ],
  },
]

/**
 * Mots-clés additionnels par emoji pour la recherche (synonymes courants).
 * Inutile de tout renseigner : la recherche couvre déjà le libellé de
 * catégorie.
 */
export const EMOJI_KEYWORDS: Record<string, string[]> = {
  '🍽️': ['plat', 'repas', 'assiette'],
  '🥘': ['plat', 'mijoté', 'poêle'],
  '🍲': ['soupe', 'pot-au-feu', 'mijoté'],
  '🥗': ['salade', 'légumes', 'crudités'],
  '🍝': ['pâtes', 'spaghetti', 'italien'],
  '🍕': ['pizza'],
  '🍔': ['burger', 'hamburger'],
  '🍣': ['sushi', 'japonais', 'poisson'],
  '🍅': ['tomate'],
  '🥕': ['carotte'],
  '🥔': ['pomme de terre', 'patate'],
  '🧅': ['oignon'],
  '🧄': ['ail'],
  '🌶️': ['piment', 'épice', 'pimenté'],
  '🍄': ['champignon'],
  '🥩': ['viande', 'steak', 'boeuf'],
  '🍗': ['poulet', 'volaille', 'cuisse'],
  '🥓': ['lard', 'bacon'],
  '🍤': ['crevette', 'gambas'],
  '🐟': ['poisson'],
  '🥚': ['oeuf'],
  '🍞': ['pain', 'mie'],
  '🥖': ['baguette', 'pain'],
  '🥐': ['croissant', 'viennoiserie'],
  '🍚': ['riz'],
  '🍰': ['gâteau', 'pâtisserie', 'dessert'],
  '🧁': ['cupcake', 'muffin'],
  '🍫': ['chocolat'],
  '🍯': ['miel'],
  '🥧': ['tarte', 'pie'],
  '🍨': ['glace', 'crème glacée'],
  '☕': ['café'],
  '🍵': ['thé', 'infusion'],
  '🍷': ['vin'],
  '🥛': ['lait'],
  '🥞': ['pancake', 'crêpe'],
  '🧇': ['gaufre'],
  '🧂': ['sel', 'assaisonnement'],
  '🌿': ['herbe', 'aromate', 'basilic'],
  '🔪': ['couteau', 'découpe'],
  '🥄': ['cuillère'],
  '🧑‍🍳': ['chef', 'cuisinier'],
}
