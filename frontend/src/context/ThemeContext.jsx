import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const KEY = 'bw_theme'
// Keep in sync with DEFAULT in index.html. Switch to 'system' once every page is redesigned.
const DEFAULT_THEME = 'light'
const query = () => window.matchMedia('(prefers-color-scheme: dark)')

const ThemeContext = createContext(null)

function readStored() {
  try {
    const t = localStorage.getItem(KEY)
    return t === 'light' || t === 'dark' || t === 'system' ? t : DEFAULT_THEME
  } catch {
    return DEFAULT_THEME
  }
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(readStored) // 'light' | 'dark' | 'system'
  const [systemDark, setSystemDark] = useState(() => query().matches)

  useEffect(() => {
    const mq = query()
    const onChange = (e) => setSystemDark(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const resolved = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme

  useEffect(() => {
    const el = document.documentElement
    el.classList.toggle('dark', resolved === 'dark')
    el.style.colorScheme = resolved
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolved === 'dark' ? '#050b1d' : '#eef4fb')
  }, [resolved])

  const setTheme = useCallback((t) => {
    setThemeState(t)
    try {
      localStorage.setItem(KEY, t)
    } catch {
      /* storage unavailable: theme still applies for this session */
    }
  }, [])

  const value = useMemo(() => ({ theme, resolved, setTheme }), [theme, resolved, setTheme])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useTheme = () => useContext(ThemeContext)
