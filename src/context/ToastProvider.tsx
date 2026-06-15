import { useCallback, useRef, useState, type ReactNode } from 'react'
import { CheckCircle2, Info, TriangleAlert, X } from 'lucide-react'

import { ToastContext, type ToastInput, type ToastTone } from './toast-context'

type Toast = {
  id: number
  message: string
  tone: ToastTone
}

const TONE_STYLE: Record<
  ToastTone,
  { wrapper: string; icon: ReactNode }
> = {
  success: {
    wrapper: 'bg-sage-deep text-white',
    icon: <CheckCircle2 className="h-5 w-5 shrink-0" />,
  },
  error: {
    wrapper: 'bg-[#b23b2e] text-white',
    icon: <TriangleAlert className="h-5 w-5 shrink-0" />,
  },
  info: {
    wrapper: 'bg-espresso text-white',
    icon: <Info className="h-5 w-5 shrink-0" />,
  },
}

export default function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(1)

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback(
    ({ message, tone = 'success', duration = 3200 }: ToastInput) => {
      const id = nextId.current++

      setToasts((current) => [...current, { id, message, tone }])

      window.setTimeout(() => dismiss(id), duration)
    },
    [dismiss],
  )

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      <div className="pointer-events-none fixed bottom-24 left-4 right-4 z-[120] flex flex-col items-center gap-2 print:hidden sm:bottom-6 sm:left-auto sm:right-6 sm:items-end">
        {toasts.map((toast) => {
          const style = TONE_STYLE[toast.tone]

          return (
            <div
              key={toast.id}
              role="status"
              className={`pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold shadow-lift ${style.wrapper}`}
            >
              {style.icon}

              <span className="flex-1">{toast.message}</span>

              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="Fermer"
                className="shrink-0 rounded-full p-1 text-white/80 transition hover:bg-white/15 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
