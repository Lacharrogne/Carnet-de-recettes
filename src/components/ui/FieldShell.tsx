import type { ReactNode } from 'react'

// Classe de base partagée par tous les champs (input, select, textarea).
export const FIELD_CLASS =
  'w-full rounded-2xl bg-linen px-4 py-3 text-cacao ring-1 ring-bark outline-none transition placeholder:text-hazel focus:bg-card focus:ring-2 focus:ring-terracotta/40'

type FieldShellProps = {
  htmlFor?: string
  label?: ReactNode
  hint?: ReactNode
  error?: ReactNode
  className?: string
  children: ReactNode
}

// Coquille commune : label au-dessus, champ, puis aide ou message d'erreur.
export default function FieldShell({
  htmlFor,
  label,
  hint,
  error,
  className = '',
  children,
}: FieldShellProps) {
  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="mb-1.5 block text-sm font-semibold text-hazel"
        >
          {label}
        </label>
      )}

      {children}

      {error ? (
        <p className="mt-1.5 text-sm font-semibold text-[#b23b2e]">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-sm text-hazel">{hint}</p>
      ) : null}
    </div>
  )
}
