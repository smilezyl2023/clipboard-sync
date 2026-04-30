'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

export interface ToastItem {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
  undoAction?: {
    label: string
    onUndo: () => void
  }
}

const DEFAULT_DURATION_MS = 3000
const MAX_VISIBLE = 5

export function useToastQueue() {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  // 组件卸载时清理所有 timer
  useEffect(() => {
    const timers = timersRef.current
    return () => {
      timers.forEach(t => clearTimeout(t))
      timers.clear()
    }
  }, [])

  const dismiss = useCallback((id: string) => {
    const timer = timersRef.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timersRef.current.delete(id)
    }
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const enqueue = useCallback(
    (
      message: string,
      type: 'success' | 'error' | 'info' = 'info',
      opts?: { durationMs?: number; undoAction?: ToastItem['undoAction'] }
    ): string => {
      const id = crypto.randomUUID()
      const duration = opts?.durationMs ?? DEFAULT_DURATION_MS

      setToasts(prev => {
        const next = [...prev, { id, message, type, undoAction: opts?.undoAction }]
        if (next.length > MAX_VISIBLE) {
          const removed = next.shift()!
          const timer = timersRef.current.get(removed.id)
          if (timer) {
            clearTimeout(timer)
            timersRef.current.delete(removed.id)
          }
        }
        return next
      })

      const timer = setTimeout(() => dismiss(id), duration)
      timersRef.current.set(id, timer)

      return id
    },
    [dismiss]
  )

  return { toasts, enqueue, dismiss }
}
