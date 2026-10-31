import { useCallback, useEffect, useState } from 'react'

/**
 * Runs an async function on mount (and whenever `deps` change) and tracks its state.
 * Returns { data, error, loading, reload }. `error` is the thrown error (ApiError has .status).
 */
export function useAsync(fn, deps = []) {
  const [state, setState] = useState({ loading: true, data: null, error: null })
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let active = true
    setState((s) => ({ ...s, loading: true, error: null }))
    fn()
      .then((data) => active && setState({ loading: false, data, error: null }))
      .catch((error) => active && setState({ loading: false, data: null, error }))
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick])

  const reload = useCallback(() => setTick((t) => t + 1), [])
  return { ...state, reload }
}
