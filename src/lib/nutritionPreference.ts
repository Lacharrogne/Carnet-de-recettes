import { useEffect, useState } from 'react'

/**
 * Préférence de confort : flouter la carte « Nutrition & coût ».
 *
 * Certaines personnes préfèrent ne pas voir les calories / macros. La carte
 * reste calculée, mais est masquée derrière un flou tant qu'on ne demande pas
 * à la révéler. Stockée localement (par appareil), appliquée immédiatement.
 */

const STORAGE_KEY = 'cr-blur-nutrition'
const CHANGE_EVENT = 'cr-blur-nutrition-change'

export function getBlurNutrition(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  return window.localStorage.getItem(STORAGE_KEY) === 'true'
}

export function setBlurNutrition(value: boolean): void {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, value ? 'true' : 'false')
  // Prévient les composants montés dans le même onglet (la même page).
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT))
}

/**
 * Hook réactif : lit la préférence et se met à jour si elle change (dans le
 * même onglet via l'événement dédié, ou depuis un autre onglet via `storage`).
 */
export function useNutritionPreference() {
  const [blurNutrition, setBlurState] = useState<boolean>(getBlurNutrition)

  useEffect(() => {
    const sync = () => setBlurState(getBlurNutrition())

    window.addEventListener(CHANGE_EVENT, sync)
    window.addEventListener('storage', sync)

    return () => {
      window.removeEventListener(CHANGE_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const setBlur = (value: boolean) => {
    setBlurState(value)
    setBlurNutrition(value)
  }

  return { blurNutrition, setBlur }
}
