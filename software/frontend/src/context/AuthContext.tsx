import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { jwtDecode } from 'jwt-decode'

export type UserRole =
  | 'admin'
  | 'docente'
  | 'tecnico'
  | 'estudiante'
  | 'invitado'

type TokenPayload = {
  sub: string
  role?: UserRole
  exp?: number
  type?: string
}

type AuthState = {
  token: string | null
  role: UserRole | null
}

type AuthContextType = {
  token: string | null
  role: UserRole | null
  isAuthenticated: boolean
  setAuth: (token: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function isTokenExpired(decoded: TokenPayload) {
  if (!decoded.exp) return false
  const nowInSeconds = Math.floor(Date.now() / 1000)
  return decoded.exp <= nowInSeconds
}

function getInitialAuthState(): AuthState {
  const savedToken = localStorage.getItem('access_token')

  if (!savedToken) {
    return { token: null, role: null }
  }

  try {
    const decoded = jwtDecode<TokenPayload>(savedToken)

    if (isTokenExpired(decoded) || decoded.type === 'partial') {
      localStorage.removeItem('access_token')
      return { token: null, role: null }
    }

    return {
      token: savedToken,
      role: decoded.role ?? null,
    }
  } catch {
    localStorage.removeItem('access_token')
    return { token: null, role: null }
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuthState] = useState<AuthState>(getInitialAuthState)

  const setAuth = useCallback((token: string) => {
    try {
      const decoded = jwtDecode<TokenPayload>(token)

      if (isTokenExpired(decoded) || decoded.type === 'partial') {
        localStorage.removeItem('access_token')
        setAuthState({
          token: null,
          role: null,
        })
        return
      }

      localStorage.setItem('access_token', token)

      setAuthState({
        token,
        role: decoded.role ?? null,
      })
    } catch {
      localStorage.removeItem('access_token')
      setAuthState({
        token: null,
        role: null,
      })
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('access_token')
    setAuthState({
      token: null,
      role: null,
    })
    window.location.href = '/login'
  }, [])

  useEffect(() => {
    const handleUnauthorized = (event: Event) => {
      const customEvent = event as CustomEvent<{ url?: string; message?: string }>
      const url = customEvent.detail?.url ?? ''

      const excludedPaths = [
        '/auth/login',
        '/auth/login/verify-2fa',
        '/auth/register',
        '/auth/refresh',
      ]

      const shouldIgnore = excludedPaths.some((path) => url.includes(path))

      if (shouldIgnore) return

      logout()
    }

    window.addEventListener('api:unauthorized', handleUnauthorized)
    return () => {
      window.removeEventListener('api:unauthorized', handleUnauthorized)
    }
  }, [logout])

  const value = useMemo(
    () => ({
      token: auth.token,
      role: auth.role,
      isAuthenticated: !!auth.token,
      setAuth,
      logout,
    }),
    [auth, setAuth, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export { AuthContext }