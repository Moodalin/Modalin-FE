import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export function useRouteFocus() {
  const location = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
    requestAnimationFrame(() => document.querySelector<HTMLElement>('main h1')?.focus())
  }, [location.pathname])
}
