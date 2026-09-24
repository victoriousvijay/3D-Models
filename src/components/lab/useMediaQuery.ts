import { useCallback, useSyncExternalStore } from 'react'

/** Tracks a CSS media query. */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (notify: () => void) => {
      const list = window.matchMedia(query)
      list.addEventListener('change', notify)
      return () => {
        list.removeEventListener('change', notify)
      }
    },
    [query],
  )
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches)
}

/** Wide screens get floating instrument panels; narrower ones get a bottom sheet. */
export const WIDE_LAYOUT_QUERY = '(min-width: 1024px)'
