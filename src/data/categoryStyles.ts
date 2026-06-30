// Source unique des styles visuels par catégorie de recette.
//
// Regroupe trois familles de styles auparavant dupliquées :
//  - HomeCardStyle    : cartes « grandes familles » (HomePage + RecipesPage)
//  - RecipeCardStyle  : carte de recette (RecipeCard)
//  - CategoryAmbience : ambiance de la page résultats par catégorie (RecipesPage)
//
// Les valeurs sont reprises telles quelles pour rester iso-visuel.

// ---------------------------------------------------------------------------
// Cartes « grandes familles » (HomePage / RecipesPage)
// ---------------------------------------------------------------------------

export type HomeCardStyle = {
  cardBg: string
  border: string
  iconBg: string
  badgeBg: string
  badgeText: string
  accentText: string
  subtleText: string
  topGlow: string
  bottomGlow: string
  miniIcons: string[]
}

const DEFAULT_HOME_CARD_STYLE: HomeCardStyle = {
  cardBg: 'bg-gradient-to-br from-[#fffaf3] to-white',
  border: 'border-orange-100',
  iconBg: 'bg-[#fff1e6]',
  badgeBg: 'bg-[#f4e8dc]',
  badgeText: 'text-stone-700',
  accentText: 'text-orange-700',
  subtleText: 'text-stone-600',
  topGlow: 'bg-orange-100/70',
  bottomGlow: 'bg-amber-50/80',
  miniIcons: ['🍽️', '✨'],
}

const HOME_CARD_STYLES: Record<string, HomeCardStyle> = {
  'Apéritifs & entrées': {
    cardBg: 'bg-gradient-to-br from-[#fffaf5] to-[#fffefb]',
    border: 'border-[#f1dcc8]',
    iconBg: 'bg-[#fff1e6]',
    badgeBg: 'bg-[#f8e7d8]',
    badgeText: 'text-[#8a5a35]',
    accentText: 'text-[#d06a2f]',
    subtleText: 'text-stone-600',
    topGlow: 'bg-[#ffd8b5]/60',
    bottomGlow: 'bg-[#ffe8d6]/80',
    miniIcons: ['🫒', '🍅'],
  },

  'Plats & accompagnements': {
    cardBg: 'bg-gradient-to-br from-[#fff8f1] to-[#fffdf9]',
    border: 'border-[#ecd8c2]',
    iconBg: 'bg-[#fff0df]',
    badgeBg: 'bg-[#f8e5cf]',
    badgeText: 'text-[#8b5e34]',
    accentText: 'text-[#c96f30]',
    subtleText: 'text-stone-600',
    topGlow: 'bg-[#ffd3a8]/60',
    bottomGlow: 'bg-[#ffe9d6]/80',
    miniIcons: ['🍝', '🥘'],
  },

  'Desserts & goûters': {
    cardBg: 'bg-gradient-to-br from-[#fff7f8] to-[#fffdfa]',
    border: 'border-[#f2d9df]',
    iconBg: 'bg-[#fff0f3]',
    badgeBg: 'bg-[#fde4ea]',
    badgeText: 'text-[#9b5a6d]',
    accentText: 'text-[#d46b87]',
    subtleText: 'text-stone-600',
    topGlow: 'bg-[#ffc8d5]/55',
    bottomGlow: 'bg-[#ffe3ea]/75',
    miniIcons: ['🍓', '🧁'],
  },

  'Petit-déjeuner & brunch': {
    cardBg: 'bg-gradient-to-br from-[#fffaf0] to-[#fffef9]',
    border: 'border-[#f1e0b9]',
    iconBg: 'bg-[#fff4d9]',
    badgeBg: 'bg-[#f9edc8]',
    badgeText: 'text-[#8a6a1e]',
    accentText: 'text-[#c28a0c]',
    subtleText: 'text-stone-600',
    topGlow: 'bg-[#ffe08c]/55',
    bottomGlow: 'bg-[#fff2c7]/75',
    miniIcons: ['☕', '🥐'],
  },

  Boissons: {
    cardBg: 'bg-gradient-to-br from-[#f3fbff] to-[#fbffff]',
    border: 'border-[#d7ebf4]',
    iconBg: 'bg-[#eaf7fd]',
    badgeBg: 'bg-[#dff1fb]',
    badgeText: 'text-[#46718a]',
    accentText: 'text-[#3b87a8]',
    subtleText: 'text-stone-600',
    topGlow: 'bg-[#c5e8f8]/55',
    bottomGlow: 'bg-[#dbf7f0]/70',
    miniIcons: ['🍋', '🧊'],
  },

  Healthy: {
    cardBg: 'bg-gradient-to-br from-[#f6fcf4] to-[#fcfffb]',
    border: 'border-[#dcebd8]',
    iconBg: 'bg-[#ebf7e7]',
    badgeBg: 'bg-[#dff0d9]',
    badgeText: 'text-[#53774f]',
    accentText: 'text-[#5b9856]',
    subtleText: 'text-stone-600',
    topGlow: 'bg-[#cfe8c8]/55',
    bottomGlow: 'bg-[#e8f8e3]/75',
    miniIcons: ['🥑', '🌿'],
  },
}

const FALLBACK_HOME_CARD_STYLES: HomeCardStyle[] = [
  DEFAULT_HOME_CARD_STYLE,
  {
    cardBg: 'bg-gradient-to-br from-[#fff8f2] to-white',
    border: 'border-[#f0dfcf]',
    iconBg: 'bg-[#fff1e6]',
    badgeBg: 'bg-[#f6e8db]',
    badgeText: 'text-[#8a5f3d]',
    accentText: 'text-[#cc6d2f]',
    subtleText: 'text-stone-600',
    topGlow: 'bg-[#ffd7bb]/60',
    bottomGlow: 'bg-[#fff1e3]/80',
    miniIcons: ['🍴', '✨'],
  },
  {
    cardBg: 'bg-gradient-to-br from-[#f8fafc] to-white',
    border: 'border-[#e4e9ef]',
    iconBg: 'bg-[#eef3f7]',
    badgeBg: 'bg-[#e6edf4]',
    badgeText: 'text-[#566575]',
    accentText: 'text-[#64748b]',
    subtleText: 'text-stone-600',
    topGlow: 'bg-[#dbe7f1]/60',
    bottomGlow: 'bg-[#f1f5f9]/80',
    miniIcons: ['🍽️', '⭐'],
  },
]

export function getHomeCardStyle(
  categoryLabel: string,
  index: number,
): HomeCardStyle {
  return (
    HOME_CARD_STYLES[categoryLabel] ??
    FALLBACK_HOME_CARD_STYLES[index % FALLBACK_HOME_CARD_STYLES.length]
  )
}

// ---------------------------------------------------------------------------
// Carte de recette (RecipeCard)
// ---------------------------------------------------------------------------

export type RecipeCardStyle = {
  cardBg: string
  imageBg: string
  ring: string
  badgeBg: string
  badgeText: string
  accentText: string
  arrowBg: string
  blob: string
  decorations: string[]
}

const DEFAULT_RECIPE_CARD_STYLE: RecipeCardStyle = {
  cardBg: 'bg-[#fffaf3]',
  imageBg: 'bg-[#fff1e6]',
  ring: 'ring-orange-100',
  badgeBg: 'bg-white/95',
  badgeText: 'text-orange-700',
  accentText: 'text-orange-700',
  arrowBg:
    'bg-orange-100 text-orange-700 group-hover:bg-orange-500 group-hover:text-white',
  blob: 'bg-orange-200/50',
  decorations: ['🍽️', '✨'],
}

const RECIPE_CARD_STYLES: Record<string, RecipeCardStyle> = {
  'Apéritifs & entrées': {
    cardBg: 'bg-gradient-to-br from-[#f7fff5] via-[#fffdf9] to-[#fff3eb]',
    imageBg: 'bg-[#edf8e9]',
    ring: 'ring-[#d9ecd3]',
    badgeBg: 'bg-[#f0faec]/95',
    badgeText: 'text-[#4d7b45]',
    accentText: 'text-[#4d8a45]',
    arrowBg:
      'bg-[#e6f5e1] text-[#4d8a45] group-hover:bg-[#69a85f] group-hover:text-white',
    blob: 'bg-[#bde5b3]/50',
    decorations: ['🫒', '🍅'],
  },

  'Plats & accompagnements': {
    cardBg: 'bg-gradient-to-br from-[#fff6ec] via-[#fffdf9] to-[#fff1df]',
    imageBg: 'bg-[#fff0df]',
    ring: 'ring-[#ffd9b8]',
    badgeBg: 'bg-[#fff0df]/95',
    badgeText: 'text-[#a85c24]',
    accentText: 'text-[#d96d1e]',
    arrowBg:
      'bg-[#ffe3c7] text-[#d96d1e] group-hover:bg-[#ff6b00] group-hover:text-white',
    blob: 'bg-[#ffc38c]/50',
    decorations: ['🍝', '🥘'],
  },

  'Desserts & goûters': {
    cardBg: 'bg-gradient-to-br from-[#fff4f7] via-[#fffdfc] to-[#fff2ed]',
    imageBg: 'bg-[#ffedf2]',
    ring: 'ring-[#ffd8e3]',
    badgeBg: 'bg-[#ffedf3]/95',
    badgeText: 'text-[#a8566b]',
    accentText: 'text-[#d86f8f]',
    arrowBg:
      'bg-[#ffe0e9] text-[#d86f8f] group-hover:bg-[#ef7e9e] group-hover:text-white',
    blob: 'bg-[#ffbdd0]/50',
    decorations: ['🍓', '🧁'],
  },

  'Petit-déjeuner & brunch': {
    cardBg: 'bg-gradient-to-br from-[#fff9ec] via-[#fffdf8] to-[#fff2d5]',
    imageBg: 'bg-[#fff3cf]',
    ring: 'ring-[#f4dda4]',
    badgeBg: 'bg-[#fff0c8]/95',
    badgeText: 'text-[#876619]',
    accentText: 'text-[#c28a0c]',
    arrowBg:
      'bg-[#ffe8a8] text-[#b77f08] group-hover:bg-[#d99a13] group-hover:text-white',
    blob: 'bg-[#ffe08c]/50',
    decorations: ['☕', '🥐'],
  },

  Boissons: {
    cardBg: 'bg-gradient-to-br from-[#eef8ff] via-[#fbfeff] to-[#edfdf7]',
    imageBg: 'bg-[#e8f5ff]',
    ring: 'ring-[#cde8f8]',
    badgeBg: 'bg-[#e8f5ff]/95',
    badgeText: 'text-[#3f6f8c]',
    accentText: 'text-[#3f8cbb]',
    arrowBg:
      'bg-[#d9efff] text-[#3f8cbb] group-hover:bg-[#4b9ac9] group-hover:text-white',
    blob: 'bg-[#b8dcf7]/50',
    decorations: ['🍋', '🧊'],
  },

  Healthy: {
    cardBg: 'bg-gradient-to-br from-[#f1fbef] via-[#fffefb] to-[#eef9ec]',
    imageBg: 'bg-[#e7f6e3]',
    ring: 'ring-[#d6ecd1]',
    badgeBg: 'bg-[#eaf7e7]/95',
    badgeText: 'text-[#4d7548]',
    accentText: 'text-[#4d934d]',
    arrowBg:
      'bg-[#ddf2d8] text-[#4d934d] group-hover:bg-[#63a85f] group-hover:text-white',
    blob: 'bg-[#bfe2b8]/50',
    decorations: ['🥑', '🌿'],
  },
}

export function getRecipeCardStyle(category: string): RecipeCardStyle {
  return RECIPE_CARD_STYLES[category] ?? DEFAULT_RECIPE_CARD_STYLE
}

// ---------------------------------------------------------------------------
// Ambiance de la page résultats par catégorie (RecipesPage)
// ---------------------------------------------------------------------------

export type CategoryAmbience = {
  pageBg: string
  ring: string
  accentText: string
  buttonText: string
  buttonHover: string
  glowOne: string
  glowTwo: string
  emojis: string[]
}

const DEFAULT_CATEGORY_AMBIENCE: CategoryAmbience = {
  pageBg: 'bg-white/95',
  ring: 'ring-orange-100',
  accentText: 'text-orange-600',
  buttonText: 'text-orange-700',
  buttonHover: 'hover:bg-orange-50',
  glowOne: 'bg-orange-100/50',
  glowTwo: 'bg-amber-100/50',
  emojis: ['🍽️', '✨', '🥄'],
}

const CATEGORY_AMBIENCES: Record<string, CategoryAmbience> = {
  'Apéritifs & entrées': {
    pageBg: 'bg-gradient-to-br from-[#f6fbef] via-[#fffdf8] to-[#fff3e8]',
    ring: 'ring-[#d9eacb]',
    accentText: 'text-[#4f8a3b]',
    buttonText: 'text-[#4f8a3b]',
    buttonHover: 'hover:bg-[#eef8e8]',
    glowOne: 'bg-[#b7df9a]/45',
    glowTwo: 'bg-[#ffb18a]/35',
    emojis: ['🫒', '🍅', '🥖', '🧀'],
  },

  'Plats & accompagnements': {
    pageBg: 'bg-gradient-to-br from-[#fff5e9] via-[#fffdf9] to-[#ffe8d2]',
    ring: 'ring-[#efd1b4]',
    accentText: 'text-[#c76525]',
    buttonText: 'text-[#c76525]',
    buttonHover: 'hover:bg-[#fff0df]',
    glowOne: 'bg-[#ffb879]/45',
    glowTwo: 'bg-[#f5c39c]/35',
    emojis: ['🍝', '🥘', '🧄', '🥔'],
  },

  'Desserts & goûters': {
    pageBg: 'bg-gradient-to-br from-[#fff3f6] via-[#fffdf9] to-[#ffe8f0]',
    ring: 'ring-[#f0cdd8]',
    accentText: 'text-[#cc5f7d]',
    buttonText: 'text-[#cc5f7d]',
    buttonHover: 'hover:bg-[#fff0f4]',
    glowOne: 'bg-[#ffb5c8]/45',
    glowTwo: 'bg-[#ffd6a5]/35',
    emojis: ['🍓', '🧁', '🍫', '🍰'],
  },

  'Petit-déjeuner & brunch': {
    pageBg: 'bg-gradient-to-br from-[#fff8dc] via-[#fffdf7] to-[#fff0c2]',
    ring: 'ring-[#ecd99b]',
    accentText: 'text-[#b47a12]',
    buttonText: 'text-[#b47a12]',
    buttonHover: 'hover:bg-[#fff4cf]',
    glowOne: 'bg-[#ffd970]/45',
    glowTwo: 'bg-[#f4b76b]/35',
    emojis: ['☕', '🥐', '🍯', '🥞'],
  },

  Boissons: {
    pageBg: 'bg-gradient-to-br from-[#eef9ff] via-[#fbffff] to-[#e8fff8]',
    ring: 'ring-[#cce8f2]',
    accentText: 'text-[#2f83a3]',
    buttonText: 'text-[#2f83a3]',
    buttonHover: 'hover:bg-[#eaf8ff]',
    glowOne: 'bg-[#a7ddf3]/45',
    glowTwo: 'bg-[#b7f0da]/35',
    emojis: ['🍋', '🧊', '🥤', '🍹'],
  },

  Healthy: {
    pageBg: 'bg-gradient-to-br from-[#effbea] via-[#fcfffb] to-[#e2f7dc]',
    ring: 'ring-[#cce5c5]',
    accentText: 'text-[#4d8f48]',
    buttonText: 'text-[#4d8f48]',
    buttonHover: 'hover:bg-[#eff9eb]',
    glowOne: 'bg-[#aad99f]/45',
    glowTwo: 'bg-[#d7efc7]/40',
    emojis: ['🥑', '🥦', '🌿', '🥬'],
  },
}

export function getCategoryAmbience(
  categoryLabel: string | null,
): CategoryAmbience | null {
  if (!categoryLabel) return null

  return CATEGORY_AMBIENCES[categoryLabel] ?? DEFAULT_CATEGORY_AMBIENCE
}
