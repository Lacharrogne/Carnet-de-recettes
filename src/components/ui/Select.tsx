import { useId, type ReactNode, type SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'

import FieldShell, { FIELD_CLASS } from './FieldShell'

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: ReactNode
  hint?: ReactNode
  error?: ReactNode
  wrapperClassName?: string
}

export default function Select({
  label,
  hint,
  error,
  wrapperClassName = '',
  className = '',
  id,
  children,
  ...rest
}: SelectProps) {
  const generatedId = useId()
  const selectId = id ?? generatedId

  return (
    <FieldShell
      htmlFor={selectId}
      label={label}
      hint={hint}
      error={error}
      className={wrapperClassName}
    >
      <div className="relative">
        <select
          id={selectId}
          className={`${FIELD_CLASS} cursor-pointer appearance-none pr-10 ${
            error ? 'ring-2 ring-field-ring' : ''
          } ${className}`}
          {...rest}
        >
          {children}
        </select>

        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-hazel"
        />
      </div>
    </FieldShell>
  )
}
