import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'md' | 'lg'

const BASE_CLASS =
  'inline-flex items-center justify-center gap-2 rounded-full text-center font-black transition disabled:cursor-not-allowed disabled:opacity-60'

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary:
    'bg-orange-500 text-white shadow-sm hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-md',
  secondary:
    'border border-orange-200 bg-white text-orange-700 hover:-translate-y-0.5 hover:bg-orange-50',
  ghost:
    'border border-orange-100 bg-white text-stone-700 hover:-translate-y-0.5 hover:bg-orange-50',
  danger:
    'border border-red-200 bg-red-50 text-red-700 hover:-translate-y-0.5 hover:bg-red-100',
}

const SIZE_CLASS: Record<ButtonSize, string> = {
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
