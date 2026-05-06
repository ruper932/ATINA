import { createContext, useMemo, useState } from 'react'
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

function getInitialAuthState(): AuthState {
  const savedToken = localStorage.getItem('access_token')

  if (!savedToken) {
    return { token: null, role: null }
  }

  try {
    const decoded = jwtDecode<TokenPayload>(savedToken)

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

  const setAuth = (token: string) => {
    try {
      const decoded = jwtDecode<TokenPayload>(token)
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
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    setAuthState({
      token: null,
      role: null,
    })
    window.location.href = '/login'
  }

  const value = useMemo(
    () => ({
      token: auth.token,
      role: auth.role,
      isAuthenticated: !!auth.token,
      setAuth,
      logout,
    }),
    [auth]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export { AuthContext }