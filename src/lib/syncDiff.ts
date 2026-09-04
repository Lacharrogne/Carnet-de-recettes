import { DAYS, MEALS, type DayKey, type MealKey, type MealPlannerState } from './weeklyPlanner'
import type { CookingHistory } from './cookingHistory'

/**
 * Calcul des différences entre l'état déjà synchronisé et le nouvel état.
 *
 * Logique **pure** et testée : c'est elle qui décide ce qui est écrit et surtout
 * ce qui est **supprimé** sur le compte. Une erreur ici effacerait des données
 * — d'où le choix de la sortir de la couche réseau pour pouvoir la vérifier.
 */

export type PlannerOp =
  | { type: 'set'; day: DayKey; meal: MealKey; recipeId: string }
  | { type: 'clear'; day: DayKey; meal: MealKey }

export type HistoryOp =
  | { type: 'set'; recipeId: string; count: number; lastCookedAt: string }
  | { type: 'delete'; recipeId: string }

/** Créneaux à écrire ou à vider pour passer de `previous` à `next`. */
export function diffPlanner(
  previous: MealPlannerState | null,
  next: MealPlannerState,
): PlannerOp[] {
  const ops: PlannerOp[] = []

  for (const day of DAYS) {
    for (const meal of MEALS) {
      const before = previous?.[day.key][meal.key] ?? ''
      const after = next[day.key][meal.key]
      if (before === after) continue

      if (after) {
        ops.push({ type: 'set', day: day.key, meal: meal.key, recipeId: after })
      } else if (previous !== null) {
        // On ne vide un créneau que si on savait qu'il était rempli : sans état
        // de référence, on n'envoie aucune suppression.
        ops.push({ type: 'clear', day: day.key, meal: meal.key })
      }
    }
  }

  return ops
}

/** Entrées d'historique à écrire ou à retirer. */
export function diffHistory(
  previous: CookingHistory | null,
  next: CookingHistory,
): HistoryOp[] {
  const ops: HistoryOp[] = []
  const before = previous ?? {}

  for (const [recipeId, entry] of Object.entries(next)) {
    const old = before[recipeId]
    if (old && old.count === entry.count && old.lastCookedAt === entry.lastCookedAt) {
      continue
    }
    ops.push({
      type: 'set',
      recipeId,
      count: entry.count,
      lastCookedAt: entry.lastCookedAt,
    })
  }

  if (previous !== null) {
    for (const recipeId of Object.keys(before)) {
      if (!(recipeId in next)) {
        ops.push({ type: 'delete', recipeId })
      }
    }
  }

  return ops
}
