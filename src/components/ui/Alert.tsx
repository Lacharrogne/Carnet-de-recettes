import type { ReactNode } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  XCircle,
  type LucideIcon,
} from 'lucide-react'

export type AlertTone = 'success' | 'error' | 'info' | 'warning'

type AlertConfig = {
  icon: LucideIcon
  className: string
  iconClassName: string
}

// Teintes ancrées dans la palette chalet (jamais de rouge/vert criards).
const TONE_CONFIG: Record<AlertTone, AlertConfig> = {
  success: {
    icon: CheckCircle2,
    className: 'bg-sage-soft text-sage-deep ring-sage/30',
    iconClassName: 'text-sage-deep',
  },
  error: {
    icon: XCircle,
    className: 'bg-[#f7e3de] text-[#b23b2e] ring-[#e9c4bc]',
    iconClassName: 'text-[#b23b2e]',
  },
  info: {
    icon: Info,
    className: 'bg-honey-soft text-[#8a5a1e] ring-honey/30',
    iconClassName: 'text-[#8a5a1e]',
  },
  warning: {
    icon: AlertTriangle,
    className: 'bg-honey-soft text-[#8a5a1e] ring-honey/40',
    iconClassName: 'text-honey',
  },
}

type AlertProps = {
  tone?: AlertTone
  children: ReactNode
  className?: string
  // Permet de remplacer l'icône par défaut (ou de la masquer avec null).
  icon?: ReactNode
}

// Message d'état cohérent (succès / erreur / info) : tuile + icône + texte.
// Remplace les blocs `bg-red-50` / `bg-green-50` disséminés dans les pages.
export default function Alert({
  tone = 'info',
  children,
  className = '',
  icon,
}: AlertProps) {
  const config = TONE_CONFIG[tone]
  const Icon = config.icon

  return (
    <div
      role="status"
      className={`flex items-start gap-3 rounded-2xl px-4 py-3 text-sm font-semibold leading-6 ring-1 ${config.className} ${className}`}
    >
      {icon === undefined ? (
        <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${config.iconClassName}`} />
      ) : (
        icon
      )}

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
