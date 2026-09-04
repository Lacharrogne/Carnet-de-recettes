import { supabase } from './supabase'
import {
  COOKING_CHANGE_EVENT,
  getCookingHistory,
  replaceLocalHistory,
  type CookingHistory,
} from './cookingHistory'
import {
  DAYS,
  MEALS,
  PLANNER_CHANGE_EVENT,
  getSavedPlanner,
  persistPlanner,
  type MealPlannerState,
} from './weeklyPlanner'
import {
  clearMealSlot,
  fetchMealPlan,
  upsertMealSlot,
} from '../services/mealPlanService'
import {
  deleteCookingEntry,
  fetchCookingHistory,
  upsertCookingEntry,
} from '../services/cookingHistoryService'
import { diffHistory, diffPlanner } from './syncDiff'

/**
 * Synchronise le planning de repas et l'historique de cuisine avec le compte.
 *
 * Le principe : **l'écran reste instantané**. On continue d'écrire dans le
 * navigateur (affichage immédiat), et cette couche répercute ensuite les
 * changements sur le compte, créneau par créneau.
 *
 * À la connexion :
 *  - si le compte a déjà un planning, il fait foi et remplace la copie locale ;
 *  - s'il est vide et qu'un planning traîne dans le navigateur, ce dernier est
 *    **poussé vers le compte** — personne ne perd ce qu'il avait avant la
 *    synchronisation.
 *
 * Ce module s'initialise au chargement (importé par `main.tsx`), comme
 * `installPrompt` : il doit être en place avant tout rendu.
 */

let currentUserId: string | null = null

/** Dernier état connu du compte, pour ne pousser que ce qui change. */
let syncedPlanner: MealPlannerState | null = null
let syncedHistory: CookingHistory | null = null

/** Empêche l'écho : les écritures venant du compte ne repartent pas vers lui. */
let applyingRemote = false

const isEmptyPlanner = (planner: MealPlannerState) =>
  DAYS.every((day) => MEALS.every((meal) => !planner[day.key][meal.key]))

/* ------------------------------------------------------------------ */
/*  Connexion : on réconcilie le navigateur et le compte               */
/* ------------------------------------------------------------------ */

async function pushWholePlanner(userId: string, planner: MealPlannerState) {
  for (const day of DAYS) {
    for (const meal of MEALS) {
      const recipeId = planner[day.key][meal.key]
      if (recipeId) {
        await upsertMealSlot(userId, day.key, meal.key, recipeId)
      }
    }
  }
}

async function pushWholeHistory(userId: string, history: CookingHistory) {
  for (const [recipeId, entry] of Object.entries(history)) {
    await upsertCookingEntry(userId, recipeId, entry.count, entry.lastCookedAt)
  }
}

function applyRemote(apply: () => void) {
  applyingRemote = true
  try {
    apply()
  } finally {
    applyingRemote = false
  }
}

async function hydrateFromAccount(userId: string) {
  const [remotePlanner, remoteHistory] = await Promise.all([
    fetchMealPlan(userId),
    fetchCookingHistory(userId),
  ])

  // Lecture impossible : on garde la copie locale et on ne pousse rien, pour
  // ne pas écraser le compte sur la foi d'une information incomplète.
  if (remotePlanner === null || remoteHistory === null) return

  const localPlanner = getSavedPlanner()
  if (isEmptyPlanner(remotePlanner) && !isEmptyPlanner(localPlanner)) {
    // Première synchronisation : le planning du navigateur rejoint le compte.
    await pushWholePlanner(userId, localPlanner)
    syncedPlanner = localPlanner
  } else {
    applyRemote(() => persistPlanner(remotePlanner))
    syncedPlanner = remotePlanner
  }

  const localHistory = getCookingHistory()
  const remoteIsEmpty = Object.keys(remoteHistory).length === 0
  if (remoteIsEmpty && Object.keys(localHistory).length > 0) {
    await pushWholeHistory(userId, localHistory)
    syncedHistory = localHistory
  } else {
    applyRemote(() => replaceLocalHistory(remoteHistory))
    syncedHistory = remoteHistory
  }
}

/* ------------------------------------------------------------------ */
/*  Changements locaux : on ne pousse que les différences              */
/* ------------------------------------------------------------------ */

async function pushPlannerDiff(userId: string, next: MealPlannerState) {
  const ops = diffPlanner(syncedPlanner, next)
  syncedPlanner = next

  for (const op of ops) {
    if (op.type === 'set') {
      await upsertMealSlot(userId, op.day, op.meal, op.recipeId)
    } else {
      await clearMealSlot(userId, op.day, op.meal)
    }
  }
}

async function pushHistoryDiff(userId: string, next: CookingHistory) {
  const ops = diffHistory(syncedHistory, next)
  syncedHistory = next

  for (const op of ops) {
    if (op.type === 'set') {
      await upsertCookingEntry(userId, op.recipeId, op.count, op.lastCookedAt)
    } else {
      await deleteCookingEntry(userId, op.recipeId)
    }
  }
}

/* ------------------------------------------------------------------ */
/*  Branchement                                                        */
/* ------------------------------------------------------------------ */

if (typeof window !== 'undefined') {
  window.addEventListener(PLANNER_CHANGE_EVENT, (event) => {
    if (applyingRemote || !currentUserId) return
    const next = (event as CustomEvent<MealPlannerState>).detail
    if (!next) return
    void pushPlannerDiff(currentUserId, next)
  })

  window.addEventListener(COOKING_CHANGE_EVENT, () => {
    if (applyingRemote || !currentUserId) return
    void pushHistoryDiff(currentUserId, getCookingHistory())
  })

  supabase.auth.onAuthStateChange((_event, session) => {
    const userId = session?.user?.id ?? null
    if (userId === currentUserId) return

    currentUserId = userId
    syncedPlanner = null
    syncedHistory = null

    if (userId) {
      void hydrateFromAccount(userId)
    }
  })
}
