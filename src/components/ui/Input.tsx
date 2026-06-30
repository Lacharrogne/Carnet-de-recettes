import { useId, type InputHTMLAttributes, type ReactNode } from 'react'

import FieldShell, { FIELD_CLASS } from './FieldShell'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: ReactNode
  hint?: ReactNode
  error?: ReactNode
  wrapperClassName?: string
}

export default function Input({
  label,
  hint,
  error,
  wrapperClassName = '',
  className = '',
  id,
  ...rest
}: InputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId

  return (
    <FieldShell
      htmlFor={inputId}
      label={label}
      hint={hint}
      error={error}
      className={wrapperClassName}
    >
      <input
        id={inputId}
        className={`${FIELD_CLASS} ${
          error ? 'ring-2 ring-field-ring' : ''
        } ${className}`}
        {...rest}
      />
    </FieldShell>
  )
}
