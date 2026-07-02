import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Returns true when the device has real internet connectivity.
 * Uses navigator.onLine as a fast hint, then confirms with a HEAD
 * request. Debounces "back online" to avoid flicker from transient
 * reconnections.
 */
export function useOnline(): boolean {
  const [online, setOnline] = useState(navigator.onLine)
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const checkReal = useCallback(async () => {
    try {
      // Tiny request to confirm real connectivity (cache-busted)
      await fetch('/favicon.ico?_=' + Date.now(), { method: 'HEAD', cache: 'no-store' })
      return true
    } catch {
      return false
    }
  }, [])

  useEffect(() => {
    function handleOffline() {
      // Immediate — trust the browser when it says offline
      if (confirmTimer.current) clearTimeout(confirmTimer.current)
      setOnline(false)
    }

    async function handleOnline() {
      // Debounce + verify: wait 1.5s, then ping to confirm real connectivity
      if (confirmTimer.current) clearTimeout(confirmTimer.current)
      confirmTimer.current = setTimeout(async () => {
        const isReal = await checkReal()
        setOnline(isReal)
      }, 1500)
    }

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)

    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
      if (confirmTimer.current) clearTimeout(confirmTimer.current)
    }
  }, [checkReal])

  return online
}
