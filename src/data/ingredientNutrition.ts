/**
 * Table de référence NUTRITION + PRIX pour l'estimation des recettes.
 *
 * Valeurs approximatives pour 100 g (kcal + macros) et prix moyen au kilo
 * (€/kg, ordre de grandeur France). Sert à une ESTIMATION, pas à une valeur
 * officielle. Les clés suivent le nom « nettoyé » du parser d'ingrédients
 * (minuscule, sans accent, singulier, sans mots de liaison : « œuf » → `oeuf`,
 * « pommes de terre » → `pomme terre`).
 *
 * `gramsPerPiece` : poids indicatif d'une unité, pour les ingrédients comptés
 * à la pièce (« 3 œufs », « 2 pommes »).
 */
export type NutritionFacts = {
  kcal: number
  prot: number
  carb: number
  fat: number
  eurPerKg: number
  gramsPerPiece?: number
}

export const INGREDIENT_NUTRITION: Record<string, NutritionFacts> = {
  // Épicerie de base
  farine: { kcal: 364, prot: 10, carb: 76, fat: 1, eurPerKg: 1.2 },
  sucre: { kcal: 400, prot: 0, carb: 100, fat: 0, eurPerKg: 1.3 },
  sel: { kcal: 0, prot: 0, carb: 0, fat: 0, eurPerKg: 0.6 },
  poivre: { kcal: 250, prot: 10, carb: 64, fat: 3, eurPerKg: 20 },
  huile: { kcal: 884, prot: 0, carb: 0, fat: 100, eurPerKg: 4 },
  'huile olive': { kcal: 884, prot: 0, carb: 0, fat: 100, eurPerKg: 8 },
  vinaigre: { kcal: 20, prot: 0, carb: 1, fat: 0, eurPerKg: 2 },
  moutarde: { kcal: 66, prot: 4, carb: 5, fat: 4, eurPerKg: 4 },
  sauce: { kcal: 100, prot: 1, carb: 10, fat: 6, eurPerKg: 4 },
  bouillon: { kcal: 20, prot: 1, carb: 2, fat: 1, eurPerKg: 10 },
  levure: { kcal: 100, prot: 12, carb: 12, fat: 1, eurPerKg: 20 },
  riz: { kcal: 350, prot: 7, carb: 78, fat: 1, eurPerKg: 2 },
  pate: { kcal: 350, prot: 12, carb: 72, fat: 2, eurPerKg: 1.8 },
  semoule: { kcal: 360, prot: 12, carb: 73, fat: 1, eurPerKg: 2 },
  quinoa: { kcal: 368, prot: 14, carb: 64, fat: 6, eurPerKg: 6 },
  lentille: { kcal: 116, prot: 9, carb: 20, fat: 0, eurPerKg: 3 },
  mais: { kcal: 86, prot: 3, carb: 19, fat: 1, eurPerKg: 3 },
  olive: { kcal: 115, prot: 1, carb: 6, fat: 11, eurPerKg: 8 },
  pain: { kcal: 265, prot: 9, carb: 49, fat: 3, eurPerKg: 3 },
  baguette: {
    kcal: 270,
    prot: 9,
    carb: 55,
    fat: 1,
    eurPerKg: 4,
    gramsPerPiece: 250,
  },

  // Crèmerie & œufs
  oeuf: { kcal: 143, prot: 13, carb: 1, fat: 10, eurPerKg: 4.5, gramsPerPiece: 55 },
  lait: { kcal: 46, prot: 3, carb: 5, fat: 2, eurPerKg: 1.1 },
  beurre: { kcal: 717, prot: 1, carb: 0, fat: 81, eurPerKg: 8 },
  creme: { kcal: 290, prot: 2, carb: 3, fat: 30, eurPerKg: 5 },
  'creme fraiche': { kcal: 290, prot: 2, carb: 3, fat: 30, eurPerKg: 5 },
  yaourt: { kcal: 60, prot: 4, carb: 5, fat: 3, eurPerKg: 3, gramsPerPiece: 125 },
  fromage: { kcal: 350, prot: 25, carb: 2, fat: 28, eurPerKg: 12 },
  mozzarella: { kcal: 280, prot: 22, carb: 2, fat: 20, eurPerKg: 9 },
  parmesan: { kcal: 400, prot: 36, carb: 4, fat: 29, eurPerKg: 20 },
  gruyere: { kcal: 410, prot: 30, carb: 0, fat: 32, eurPerKg: 14 },
  emmental: { kcal: 380, prot: 28, carb: 0, fat: 29, eurPerKg: 12 },
  comte: { kcal: 410, prot: 27, carb: 0, fat: 34, eurPerKg: 18 },
  cheddar: { kcal: 400, prot: 25, carb: 1, fat: 33, eurPerKg: 12 },

  // Viandes & poissons
  poulet: { kcal: 165, prot: 31, carb: 0, fat: 4, eurPerKg: 9 },
  boeuf: { kcal: 250, prot: 26, carb: 0, fat: 15, eurPerKg: 15 },
  porc: { kcal: 242, prot: 27, carb: 0, fat: 14, eurPerKg: 10 },
  dinde: { kcal: 135, prot: 29, carb: 0, fat: 2, eurPerKg: 11 },
  canard: { kcal: 240, prot: 19, carb: 0, fat: 18, eurPerKg: 18 },
  jambon: { kcal: 145, prot: 18, carb: 1, fat: 8, eurPerKg: 12 },
  lardon: { kcal: 300, prot: 15, carb: 1, fat: 27, eurPerKg: 9 },
  bacon: { kcal: 400, prot: 12, carb: 1, fat: 40, eurPerKg: 12 },
  merguez: { kcal: 300, prot: 15, carb: 1, fat: 27, eurPerKg: 10 },
  viande: { kcal: 250, prot: 26, carb: 0, fat: 15, eurPerKg: 13 },
  saumon: { kcal: 208, prot: 20, carb: 0, fat: 13, eurPerKg: 20 },
  thon: { kcal: 130, prot: 29, carb: 0, fat: 1, eurPerKg: 12 },
  poisson: { kcal: 120, prot: 20, carb: 0, fat: 4, eurPerKg: 15 },

  // Fruits & légumes
  'pomme terre': { kcal: 77, prot: 2, carb: 17, fat: 0, eurPerKg: 1.2, gramsPerPiece: 150 },
  patate: { kcal: 77, prot: 2, carb: 17, fat: 0, eurPerKg: 1.2, gramsPerPiece: 150 },
  tomate: { kcal: 18, prot: 1, carb: 4, fat: 0, eurPerKg: 2.5, gramsPerPiece: 120 },
  oignon: { kcal: 40, prot: 1, carb: 9, fat: 0, eurPerKg: 1.5, gramsPerPiece: 110 },
  echalote: { kcal: 72, prot: 2, carb: 17, fat: 0, eurPerKg: 4, gramsPerPiece: 30 },
  ail: { kcal: 149, prot: 6, carb: 33, fat: 1, eurPerKg: 8, gramsPerPiece: 5 },
  carotte: { kcal: 41, prot: 1, carb: 10, fat: 0, eurPerKg: 1.5, gramsPerPiece: 80 },
  courgette: { kcal: 17, prot: 1, carb: 3, fat: 0, eurPerKg: 2.5, gramsPerPiece: 200 },
  aubergine: { kcal: 25, prot: 1, carb: 6, fat: 0, eurPerKg: 3, gramsPerPiece: 250 },
  poivron: { kcal: 26, prot: 1, carb: 6, fat: 0, eurPerKg: 3.5, gramsPerPiece: 150 },
  poireau: { kcal: 61, prot: 1, carb: 14, fat: 0, eurPerKg: 2.5, gramsPerPiece: 150 },
  champignon: { kcal: 22, prot: 3, carb: 3, fat: 0, eurPerKg: 6, gramsPerPiece: 20 },
  salade: { kcal: 15, prot: 1, carb: 3, fat: 0, eurPerKg: 3, gramsPerPiece: 300 },
  concombre: { kcal: 15, prot: 1, carb: 3, fat: 0, eurPerKg: 2, gramsPerPiece: 300 },
  pomme: { kcal: 52, prot: 0, carb: 14, fat: 0, eurPerKg: 2.5, gramsPerPiece: 150 },
  poire: { kcal: 57, prot: 0, carb: 15, fat: 0, eurPerKg: 2.8, gramsPerPiece: 170 },
  banane: { kcal: 89, prot: 1, carb: 23, fat: 0, eurPerKg: 2, gramsPerPiece: 120 },
  orange: { kcal: 47, prot: 1, carb: 12, fat: 0, eurPerKg: 2.5, gramsPerPiece: 200 },
  citron: { kcal: 29, prot: 1, carb: 9, fat: 0, eurPerKg: 3, gramsPerPiece: 100 },
  fraise: { kcal: 32, prot: 1, carb: 8, fat: 0, eurPerKg: 8 },
  framboise: { kcal: 52, prot: 1, carb: 12, fat: 1, eurPerKg: 14 },
  melon: { kcal: 34, prot: 1, carb: 8, fat: 0, eurPerKg: 2.5, gramsPerPiece: 900 },

  // Épicerie sucrée & aromates
  chocolat: { kcal: 540, prot: 5, carb: 60, fat: 31, eurPerKg: 12 },
  cacao: { kcal: 350, prot: 20, carb: 15, fat: 20, eurPerKg: 15 },
  miel: { kcal: 300, prot: 0, carb: 82, fat: 0, eurPerKg: 8 },
  vanille: { kcal: 288, prot: 0, carb: 13, fat: 0, eurPerKg: 100 },
  amande: { kcal: 580, prot: 21, carb: 20, fat: 50, eurPerKg: 15 },
  noisette: { kcal: 630, prot: 15, carb: 17, fat: 61, eurPerKg: 14 },
  biscuit: { kcal: 480, prot: 6, carb: 65, fat: 22, eurPerKg: 8 },
  caramel: { kcal: 400, prot: 1, carb: 90, fat: 8, eurPerKg: 10 },
  basilic: { kcal: 25, prot: 3, carb: 3, fat: 0, eurPerKg: 40 },
  persil: { kcal: 36, prot: 3, carb: 6, fat: 1, eurPerKg: 30 },

  // Boissons
  eau: { kcal: 0, prot: 0, carb: 0, fat: 0, eurPerKg: 0.3 },
  cafe: { kcal: 2, prot: 0, carb: 0, fat: 0, eurPerKg: 15 },
  the: { kcal: 1, prot: 0, carb: 0, fat: 0, eurPerKg: 30 },
  jus: { kcal: 45, prot: 0, carb: 11, fat: 0, eurPerKg: 2 },
}
