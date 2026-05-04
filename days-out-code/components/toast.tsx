'use client'

import { createContext, useContext, useEffect, useState } from 'react'

interface ToastContextValue {
  showToast: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}

interface ToastProviderProps {
  children: React.ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [message, setMessage] = useState<string | null>(null)

  function showToast(msg: string) {
    setMessage(msg)
  }

  useEffect(() => {
    if (!message) return
    const timer = setTimeout(() => setMessage(null), 2500)
    return () => clearTimeout(timer)
  }, [message])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {message && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] pointer-events-none">
          <div className="bg-[var(--color-foreground)] text-white px-5 py-3 rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] text-sm font-medium whitespace-nowrap">
            {message}
          </div>
        </div>
      )}
    </ToastContext.Provider>
  )
}
