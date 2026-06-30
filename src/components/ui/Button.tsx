import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'soft'
  | 'ghost'
  | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

const BASE_CLASS =
  'inline-flex items-center justify-center gap-2 rounded-full text-center font-bold transition duration-200 outline-none focus-visible:ring-4 focus-visible:ring-terracotta/25 disabled:cursor-not-allowed disabled:opacity-60'

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary:
    'bg-terracotta text-white shadow-soft hover:-translate-y-0.5 hover:bg-terracotta-deep hover:shadow-card',
  secondary:
    'bg-card text-cacao ring-1 ring-bark hover:-translate-y-0.5 hover:bg-linen',
  soft: 'bg-terracotta-soft text-terracotta-deep hover:-translate-y-0.5 hover:bg-terracotta-hover',
  ghost: 'text-hazel hover:bg-linen',
  danger:
    'bg-danger-soft text-danger ring-1 ring-field-ring hover:-translate-y-0.5 hover:bg-[#f2d4cd]',
}

const SIZE_CLASS: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3',
  lg: 'px-7 py-4',
}

type StyleProps = {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  className?: string
}

type CommonProps = StyleProps & {
  children: ReactNode
}

type ButtonAsButton = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'>

type ButtonAsLink = CommonProps & {
  to: string
}

export type ButtonProps = ButtonAsButton | ButtonAsLink

function buildClassName({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
}: StyleProps) {
  return [
    BASE_CLASS,
    VARIANT_CLASS[variant],
    SIZE_CLASS[size],
    fullWidth ? 'w-full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')
}

export default function Button(props: ButtonProps) {
  if ('to' in props && props.to) {
    const { to, variant, size, fullWidth, className, children } = props

    return (
      <Link
        to={to}
        className={buildClassName({ variant, size, fullWidth, className })}
      >
        {children}
      </Link>
    )
  }

  const { variant, size, fullWidth, className, children, ...buttonProps } =
    props as ButtonAsButton

  return (
    <button
      className={buildClassName({ variant, size, fullWidth, className })}
      {...buttonProps}
    >
      {children}
    </button>
  )
}
