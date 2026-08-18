import React, { useState, useEffect } from 'react'
import { Check, X, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastItem {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
}

// Global listeners registry
type ToastListener = (toast: ToastItem) => void
const listeners = new Set<ToastListener>()

export const toast = {
  success: (title: string, message?: string, duration: number = 3500) => {
    dispatchToast({ id: `t-${Date.now()}-${Math.random()}`, type: 'success', title, message, duration })
  },
  error: (title: string, message?: string, duration: number = 4500) => {
    dispatchToast({ id: `t-${Date.now()}-${Math.random()}`, type: 'error', title, message, duration })
  },
  warning: (title: string, message?: string, duration: number = 4000) => {
    dispatchToast({ id: `t-${Date.now()}-${Math.random()}`, type: 'warning', title, message, duration })
  },
  info: (title: string, message?: string, duration: number = 3500) => {
    dispatchToast({ id: `t-${Date.now()}-${Math.random()}`, type: 'info', title, message, duration })
  },
}

function dispatchToast(item: ToastItem) {
  listeners.forEach((fn) => fn(item))
}

/**
 * Toast Container:
 * Sleek, modern, and minimalist floating notification pill at top-center.
 */
export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => {
    const handler: ToastListener = (newToast) => {
      // Keep up to 3 toasts at a time
      setToasts((prev) => [...prev.slice(-2), newToast])
    }
    listeners.add(handler)
    return () => {
      listeners.delete(handler)
    }
  }, [])

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <div
      aria-live="polite"
      className="fixed top-5 left-1/2 -translate-x-1/2 z-[99999] flex flex-col items-center gap-2 w-full max-w-sm px-4 pointer-events-none"
    >
      {toasts.map((t) => (
        <ToastCard key={t.id} item={t} onDismiss={() => removeToast(t.id)} />
      ))}
    </div>
  )
}

const ToastCard: React.FC<{ item: ToastItem; onDismiss: () => void }> = ({
  item,
  onDismiss,
}) => {
  const duration = item.duration || 3500

  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss()
    }, duration)
    return () => clearTimeout(timer)
  }, [duration, onDismiss])

  const config = {
    success: {
      icon: (
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white shrink-0 shadow-sm">
          <Check className="h-4 w-4 stroke-[2.5]" />
        </div>
      ),
      titleColor: 'text-slate-900',
    },
    error: {
      icon: (
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-500 text-white shrink-0 shadow-sm">
          <AlertCircle className="h-4 w-4 stroke-[2.5]" />
        </div>
      ),
      titleColor: 'text-slate-900',
    },
    warning: {
      icon: (
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-white shrink-0 shadow-sm">
          <AlertTriangle className="h-4 w-4 stroke-[2.5]" />
        </div>
      ),
      titleColor: 'text-slate-900',
    },
    info: {
      icon: (
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0092b3] text-white shrink-0 shadow-sm">
          <Info className="h-4 w-4 stroke-[2.5]" />
        </div>
      ),
      titleColor: 'text-slate-900',
    },
  }[item.type]

  return (
    <div
      className={cn(
        'pointer-events-auto flex items-center gap-3 w-full bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/80 px-3.5 py-3 shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-200',
        'animate-in slide-in-from-top-3 fade-in zoom-in-95'
      )}
    >
      {config.icon}

      <div className="flex-1 min-w-0 pr-1">
        <h4 className={cn('text-xs font-bold leading-tight truncate', config.titleColor)}>
          {item.title}
        </h4>
        {item.message && (
          <p className="text-[11px] font-medium text-slate-500 leading-snug mt-0.5 break-words line-clamp-2">
            {item.message}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={onDismiss}
        className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition-colors cursor-pointer shrink-0"
        aria-label="Close"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
