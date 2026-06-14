export type StepTimer = {
  label: string
  seconds: number
}

// Formate une durée en HH:MM:SS (ou MM:SS sous une heure).
export function formatTimerTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(
      2,
      '0',
    )}:${String(remainingSeconds).padStart(2, '0')}`
  }

  return `${String(minutes).padStart(2, '0')}:${String(
    remainingSeconds,
  ).padStart(2, '0')}`
}

// Détecte les durées mentionnées dans le texte d'une étape (« 10 min »,
// « 1h30 », « 2 heures », « 30 secondes »…) pour proposer des minuteurs.
// Les doublons (même libellé + même durée) sont éliminés.
export function getStepTimers(step: string): StepTimer[] {
  const timers: StepTimer[] = []
  const timerKeys = new Set<string>()
  const normalizedStep = step.replace(/,/g, '.')

  function addTimer(label: string, seconds: number) {
    if (seconds <= 0) return

    const cleanedLabel = label.replace(/\s+/g, ' ').trim()
    const key = `${cleanedLabel}-${seconds}`

    if (timerKeys.has(key)) return

    timerKeys.add(key)

    timers.push({
      label: cleanedLabel,
      seconds,
    })
  }

  for (const match of normalizedStep.matchAll(/\b(\d+)\s*h\s*(\d{1,2})?\b/gi)) {
    const hours = Number(match[1])
    const minutes = Number(match[2] || 0)

    addTimer(match[0], hours * 3600 + minutes * 60)
  }

  for (const match of normalizedStep.matchAll(/\b(\d+)\s*heures?\b/gi)) {
    const hours = Number(match[1])

    addTimer(match[0], hours * 3600)
  }

  for (const match of normalizedStep.matchAll(
    /\b(\d+)(?:\s*(?:a|à|-)\s*(\d+))?\s*(minutes?|mins?|min)\b/gi,
  )) {
    const startMinutes = Number(match[1])
    const endMinutes = match[2] ? Number(match[2]) : null

    addTimer(match[0], (endMinutes ?? startMinutes) * 60)
  }

  for (const match of normalizedStep.matchAll(
    /\b(\d+)\s*(secondes?|secs?|sec)\b/gi,
  )) {
    const seconds = Number(match[1])

    addTimer(match[0], seconds)
  }

  return timers
}
