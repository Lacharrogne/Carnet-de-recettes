import { useId, type ReactNode, type TextareaHTMLAttributes } from 'react'

import FieldShell, { FIELD_CLASS } from './FieldShell'

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: ReactNode
  hint?: ReactNode
  error?: ReactNode
  wrapperClassName?: string
}

export default function Textarea({
  label,
  hint,
  error,
  wrapperClassName = '',
  className = '',
  id,
  ...rest
}: TextareaProps) {
  const generatedId = useId()
  const textareaId = id ?? generatedId

  return (
    <FieldShell
      htmlFor={textareaId}
      label={label}
      hint={hint}
      error={error}
      className={wrapperClassName}
    >
      <textarea
        id={textareaId}
        className={`${FIELD_CLASS} resize-y leading-7 ${
          error ? 'ring-2 ring-[#e9c4bc]' : ''
        } ${className}`}
        {...rest}
      />
    </FieldShell>
  )
}
