import type { ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'honey'
type Size = 'md' | 'lg'

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-full text-center font-bold transition duration-200 outline-none focus-visible:ring-4 focus-visible:ring-terracotta/25 disabled:cursor-not-allowed disabled:opacity-60'

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-terracotta text-white shadow-soft hover:-translate-y-0.5 hover:bg-terracotta-deep hover:shadow-card',
  secondary:
    'bg-card text-cacao ring-1 ring-bark hover:-translate-y-0.5 hover:bg-linen',
  ghost: 'text-cream-100 hover:bg-white/10',
  honey:
    'bg-honey text-espresso shadow-soft hover:-translate-y-0.5 hover:bg-[#e7a94e] hover:shadow-card',
}

const SIZES: Record<Size, string> = {
  md: 'px-6 py-3',
  lg: 'px-7 py-4',
}

type ButtonProps = {
  children: ReactNode
  href?: string | null
  onClick?: () => void
  variant?: Variant
  size?: Size
  fullWidth?: boolean
  disabled?: boolean
  className?: string
  external?: boolean
}

export default function Button({
  children,
  href,
  onClick,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  className = '',
  external = true,
}: ButtonProps) {
  const classes = [
    BASE,
    VARIANTS[variant],
    SIZES[size],
    fullWidth ? 'w-full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  if (href && !disabled) {
    return (
      <a
        href={href}
        className={classes}
        {...(external
          ? { target: '_blank', rel: 'noopener noreferrer' }
          : {})}
      >
        {children}
      </a>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={classes}
    >
      {children}
    </button>
  )
}
