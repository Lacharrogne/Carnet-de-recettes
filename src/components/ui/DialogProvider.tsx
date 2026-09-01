import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import {
  DialogContext,
  type AlertOptions,
  type ConfirmOptions,
  type DialogApi,
  type PromptOptions,
} from '../../context/dialogContext'

type ActiveDialog =
  | {
      kind: 'confirm'
      options: ConfirmOptions
      resolve: (value: boolean) => void
    }
  | {
      kind: 'prompt'
      options: PromptOptions
      resolve: (value: string | null) => void
    }
  | {
      kind: 'alert'
      options: AlertOptions
      resolve: () => void
    }

/**
 * Remplace les boîtes natives du navigateur (window.confirm / prompt / alert)
 * par de vraies fenêtres in-app, aux couleurs de Carnet de recettes.
 */
export default function DialogProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<ActiveDialog | null>(null)
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setActive({ kind: 'confirm', options, resolve })
    })
  }, [])

  const prompt = useCallback((options: PromptOptions) => {
    return new Promise<string | null>((resolve) => {
      setInputValue(options.defaultValue ?? '')
      setActive({ kind: 'prompt', options, resolve })
    })
  }, [])

  const alert = useCallback((options: AlertOptions) => {
    return new Promise<void>((resolve) => {
      setActive({ kind: 'alert', options, resolve })
    })
  }, [])

  const api = useMemo<DialogApi>(
    () => ({ confirm, prompt, alert }),
    [confirm, prompt, alert],
  )

  const close = useCallback(
    (result: boolean | string | null) => {
      if (!active) return

      if (active.kind === 'confirm') {
        active.resolve(result === true)
      } else if (active.kind === 'prompt') {
        active.resolve(typeof result === 'string' ? result : null)
      } else {
        active.resolve()
      }

      setActive(null)
    },
    [active],
  )

  const cancel = useCallback(() => {
    close(active?.kind === 'prompt' ? null : false)
  }, [active, close])

  const validate = useCallback(() => {
    close(active?.kind === 'prompt' ? inputValue.trim() : true)
  }, [active, close, inputValue])

  useEffect(() => {
    if (!active) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        cancel()
      }
    }
    document.addEventListener('keydown', onKeyDown)

    if (active.kind === 'prompt') {
      const id = window.setTimeout(() => inputRef.current?.focus(), 40)
      return () => {
        document.removeEventListener('keydown', onKeyDown)
        window.clearTimeout(id)
      }
    }

    return () => document.removeEventListener('keydown', onKeyDown)
  }, [active, cancel])

  const isDanger =
    active?.kind === 'confirm' && active.options.tone === 'danger'

  const confirmClass = isDanger
    ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/25 hover:bg-rose-500'
    : 'bg-terracotta text-white shadow-lg shadow-terracotta/25 hover:bg-terracotta-deep'

  return (
    <DialogContext.Provider value={api}>
      {children}

      {active && (
        <div
          className="fixed inset-0 z-[120] flex items-end justify-center p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            aria-label="Fermer"
            onClick={cancel}
            className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
          />

          <div className="relative w-full max-w-md rounded-[1.75rem] border border-bark bg-cream-50 p-6 text-left shadow-2xl">
            {active.options.title && (
              <h2 className="font-display text-xl font-black text-stone-950">
                {active.options.title}
              </h2>
            )}

            <p className="mt-1.5 text-sm leading-relaxed text-stone-600">
              {active.options.message}
            </p>

            {active.kind === 'prompt' && (
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                placeholder={active.options.placeholder}
                onChange={(event) => setInputValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    validate()
                  }
                }}
                className="mt-4 w-full rounded-2xl border border-bark bg-white px-4 py-3 text-base text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-terracotta/60 focus:ring-2 focus:ring-terracotta/20"
              />
            )}

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              {active.kind !== 'alert' && (
                <button
                  type="button"
                  onClick={cancel}
                  className="rounded-full border border-bark bg-white px-5 py-2.5 text-sm font-bold text-cacao transition hover:bg-linen"
                >
                  {active.options.cancelLabel ?? 'Annuler'}
                </button>
              )}

              <button
                type="button"
                onClick={validate}
                className={`rounded-full px-5 py-2.5 text-sm font-black transition hover:-translate-y-0.5 ${
                  active.kind === 'alert'
                    ? 'bg-terracotta text-white shadow-lg shadow-terracotta/25 hover:bg-terracotta-deep'
                    : confirmClass
                }`}
              >
                {active.kind === 'alert'
                  ? active.options.confirmLabel ?? 'OK'
                  : active.options.confirmLabel ?? 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  )
}
