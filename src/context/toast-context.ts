import { createContext } from 'react'

export type ToastTone = 'success' | 'error' | 'info'

export type ToastInput = {
  message: string
  tone?: ToastTone
  duration?: number
}

export type ToastContextValue = {
  showToast: (toast: ToastInput) => void
}

export const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
})
