import { useEffect, useState } from 'react'

// Hash-based routing (#/plan?...) so every page works on static hosting
// without server rewrites, and every plan has a shareable URL.

export type Route = { path: string; params: URLSearchParams }

export function parseHash(): Route {
  const raw = window.location.hash.replace(/^#/, '')
  const [path = '', query = ''] = raw.split('?')
  return { path: path.replace(/\/+$/, '') || '/', params: new URLSearchParams(query) }
}

export function hrefFor(path: string, params: Record<string, string | undefined> = {}): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value)
  }
  const query = search.toString()
  return `#${path}${query ? `?${query}` : ''}`
}

export function navigate(href: string) {
  window.location.hash = href.replace(/^#/, '')
}

export function useHashRoute(): Route {
  const [route, setRoute] = useState(parseHash)
  useEffect(() => {
    const onChange = () => setRoute(parseHash())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}
