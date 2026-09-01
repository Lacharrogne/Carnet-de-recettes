import { createContext, useContext } from 'react'

export type ConfirmOptions = {
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'default' | 'danger'
}

export type PromptOptions = {
  title?: string
  message: string
  defaultValue?: string
  placeholder?: string
  confirmLabel?: string
  cancelLabel?: string
}

export type AlertOptions = {
  title?: string
  message: string
  confirmLabel?: string
}

export type DialogApi = {
  /** Boîte de confirmation. Résout `true` si l'utilisateur valide. */
  confirm: (options: ConfirmOptions) => Promise<boolean>
  /** Saisie d'un texte. Résout la valeur, ou `null` si annulé. */
  prompt: (options: PromptOptions) => Promise<string | null>
  /** Simple information. Résout quand l'utilisateur ferme. */
  alert: (options: AlertOptions) => Promise<void>
}

export const DialogContext = createContext<DialogApi | null>(null)

export function useDialogs(): DialogApi {
  const context = useContext(DialogContext)
  if (!context) {
    throw new Error('useDialogs doit être utilisé dans un <DialogProvider>.')
  }
  return context
}
