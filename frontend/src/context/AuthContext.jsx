import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { authApi } from '../api/auth'
import { tokenStore } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true) // true while restoring a session

  // Restore session on page load
  useEffect(() => {
    let active = true
    authApi
      .me()
      .then((res) => active && setUser(res.data.user))
      .catch(() => {
        tokenStore.clear()
        if (active) setUser(null)
      })
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  // Used by both login and OTP verification (both return { token, user })
  const startSession = useCallback((data) => {
    tokenStore.set(data.token)
    setUser(data.user)
  }, [])

  const login = useCallback(
    async (email, password) => {
      const res = await authApi.login(email, password)
      startSession(res.data)
    },
    [startSession]
  )

  const verifyOtp = useCallback(
    async (email, otp) => {
      const res = await authApi.verifyOtp(email, otp)
      startSession(res.data)
    },
    [startSession]
  )

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      /* clear locally even if the request fails */
    }
    tokenStore.clear()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, verifyOtp, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
