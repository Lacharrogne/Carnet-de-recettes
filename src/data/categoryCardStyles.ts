export type CategoryCardStyle = {
  cardBg: string
  ring: string
  iconBg: string
  badgeBg: string
  badgeText: string
  accentText: string
  linkClass: string
  blobClass: string
  decorations: string[]
}

const DEFAULT_CATEGORY_CARD_STYLE: CategoryCardStyle = {
  cardBg: 'bg-white',
  ring: 'ring-orange-100',
  iconBg: 'bg-[#fff1e6]',
  badgeBg: 'bg-[#f4e8dc]',
  badgeText: 'text-stone-700',
  accentText: 'text-orange-600',
  linkClass: 'text-orange-600 group-hover:text-orange-700',
  blobClass: 'bg-orange-100/70',
  decorations: ['🍽️', '✨'],
}

export const CATEGORY_CARD_STYLES: Record<string, CategoryCardStyle> = {
  'Apéritifs & entrées': {
    cardBg: 'bg-gradient-to-br from-[#f6fcf5] via-[#fffdf9] to-[#fff3eb]',
    ring: 'ring-[#d7ead3]',
    iconBg: 'bg-[#ecf8e8]',
    badgeBg: 'bg-[#edf7ea]',
    badgeText: 'text-[#456a40]',
    accentText: 'text-[#5f9a56]',
    linkClass: 'text-[#4c8b44] group-hover:text-[#3d7237]',
    blobClass: 'bg-[#bfe3b6]/60',
    decorations: ['🫒', '🍅'],
  },

  'Plats & accompagnements': {
    cardBg: 'bg-gradient-to-br from-[#fff5ec] via-[#fffdfa] to-[#fff0e1]',
    ring: 'ring-[#ffd7b5]',
    iconBg: 'bg-[#fff0e0]',
    badgeBg: 'bg-[#ffe9d6]',
    badgeText: 'text-[#91582c]',
    accentText: 'text-[#d96d1e]',
    linkClass: 'text-[#d96d1e] group-hover:text-[#b95810]',
    blobClass: 'bg-[#ffc38f]/60',
    decorations: ['🍝', '🥘'],
  },

  'Desserts & goûters': {
    cardBg: 'bg-gradient-to-br from-[#fff4f7] via-[#fffdfc] to-[#fff3ec]',
    ring: 'ring-[#ffd9e2]',
    iconBg: 'bg-[#ffedf2]',
    badgeBg: 'bg-[#ffe8ef]',
    badgeText: 'text-[#9c5668]',
    accentText: 'text-[#e27c98]',
    linkClass: 'text-[#d96f8d] group-hover:text-[#bc5674]',
    blobClass: 'bg-[#ffbfd0]/60',
    decorations: ['🍓', '🧁'],
  },

  'Petit-déjeuner & brunch': {
    cardBg: 'bg-gradient-to-br from-[#fff9eb] via-[#fffdf8] to-[#fff3d8]',
    ring: 'ring-[#f7e0a7]',
    iconBg: 'bg-[#fff3cf]',
    badgeBg: 'bg-[#fff0c7]',
    badgeText: 'text-[#8c6a1d]',
    accentText: 'text-[#d69b12]',
    linkClass: 'text-[#c58b0d] group-hover:text-[#a87406]',
    blobClass: 'bg-[#ffe08c]/60',
    decorations: ['☕', '🥐'],
  },

  Boissons: {
    cardBg: 'bg-gradient-to-br from-[#eef8ff] via-[#fbfeff] to-[#edfdf7]',
    ring: 'ring-[#cfe7f8]',
    iconBg: 'bg-[#e8f5ff]',
    badgeBg: 'bg-[#e4f3ff]',
    badgeText: 'text-[#416c87]',
    accentText: 'text-[#4b9ac9]',
    linkClass: 'text-[#3f8cbb] group-hover:text-[#2f729b]',
    blobClass: 'bg-[#b8dcf7]/60',
    decorations: ['🍋', '🧊'],
  },

  Healthy: {
    cardBg: 'bg-gradient-to-br from-[#f2fbf1] via-[#fffefb] to-[#eef9ec]',
    ring: 'ring-[#d7ebd2]',
    iconBg: 'bg-[#e7f6e3]',
    badgeBg: 'bg-[#eaf7e7]',
    badgeText: 'text-[#4d7548]',
    accentText: 'text-[#5aa05a]',
    linkClass: 'text-[#4e934e] group-hover:text-[#3f793f]',
    blobClass: 'bg-[#bfe2b8]/60',
    decorations: ['🥑', '🌿'],
  },
}

export function getCategoryCardStyle(label: string): CategoryCardStyle {
  return CATEGORY_CARD_STYLES[label] ?? DEFAULT_CATEGORY_CARD_STYLE
}