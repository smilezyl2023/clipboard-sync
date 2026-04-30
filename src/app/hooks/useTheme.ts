'use client'

import { useState, useEffect, useCallback } from 'react'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'clipboard_sync_theme'

function getStoredTheme(): Theme | null {
  if (typeof window === 'undefined') return null
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return null
}

function applyTheme(t: Theme) {
  document.documentElement.setAttribute('data-theme', t)
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    const stored = getStoredTheme()
    const mq = window.matchMedia('(prefers-color-scheme: dark)')

    const resolve = () => {
      const t = stored ?? (mq.matches ? 'dark' : 'light')
      setTheme(t)
      applyTheme(t)
    }

    resolve()

    // 仅在无手动存储时跟随系统偏好变化
    if (!stored) {
      const handler = (e: MediaQueryListEvent) => {
        const t = e.matches ? 'dark' : 'light'
        setTheme(t)
        applyTheme(t)
      }
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    }
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark'
      localStorage.setItem(STORAGE_KEY, next)
      applyTheme(next)
      return next
    })
  }, [])

  return { theme, toggleTheme } as const
}
