import { useEffect, useState, type ReactNode } from 'react'

type ModalProps = {
  open: boolean
  onClose: () => void
  title?: ReactNode
  children: ReactNode
  // Largeur max du panneau (classe Tailwind), défaut max-w-lg.
  maxWidthClassName?: string
}

export default function Modal({
  open,
  onClose,
  title,
  children,
  maxWidthClassName = 'max-w-lg',
}: ModalProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!open) return

    const raf = requestAnimationFrame(() => setVisible(true))

    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = previousOverflow
      setVisible(false)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-5 sm:py-8">
      <button
        type="button"
        aria-label="Fermer"
        onClick={onClose}
        className={`absolute inset-0 cursor-default bg-espresso/40 backdrop-blur-sm transition-opacity duration-200 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
      />

      <div
        role="dialog"
        aria-modal="true"
        className={`relative z-10 max-h-[calc(100dvh-40px)] w-full overflow-y-auto rounded-2xl bg-card p-5 shadow-lift ring-1 ring-bark transition duration-200 sm:p-6 ${maxWidthClassName} ${
          visible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          {title ? (
            <h2 className="text-xl font-bold text-espresso sm:text-2xl">
              {title}
            </h2>
          ) : (
            <span />
          )}

          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linen text-xl font-bold text-cacao transition hover:bg-sand"
          >
            ×
          </button>
        </div>

        {children}
      </div>
    </div>
  )
}
