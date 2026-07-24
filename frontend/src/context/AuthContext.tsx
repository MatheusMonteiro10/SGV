import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import api, { TOKEN_KEY } from '../api/axios'
import { isTokenExpired } from '../utils/jwt'
import type { LoginResponse, Usuario } from '../types/auth'

const USUARIO_KEY = 'sgv:usuario'

interface AuthContextValue {
  usuario: Usuario | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, senha: string) => Promise<void>
  loginWithGoogle: (idToken: string) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function limparStorage() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USUARIO_KEY)
}

function readSessaoValida(): Usuario | null {
  const token = localStorage.getItem(TOKEN_KEY)
  const raw = localStorage.getItem(USUARIO_KEY)
  if (!token || !raw) return null

  if (isTokenExpired(token)) {
    limparStorage()
    return null
  }

  try {
    return JSON.parse(raw) as Usuario
  } catch {
    limparStorage()
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(() => readSessaoValida())
  const [isLoading, setIsLoading] = useState(false)

  const logout = useCallback(() => {
    limparStorage()
    setUsuario(null)
  }, [])

  const persistirSessao = useCallback((data: LoginResponse) => {
    localStorage.setItem(TOKEN_KEY, data.token)
    localStorage.setItem(USUARIO_KEY, JSON.stringify(data.usuario))
    setUsuario(data.usuario)
  }, [])

  const login = useCallback(
    async (email: string, senha: string) => {
      setIsLoading(true)
      try {
        const { data } = await api.post<LoginResponse>('/auth/login', { email, senha })
        persistirSessao(data)
      } finally {
        setIsLoading(false)
      }
    },
    [persistirSessao],
  )

  const loginWithGoogle = useCallback(
    async (idToken: string) => {
      setIsLoading(true)
      try {
        const { data } = await api.post<LoginResponse>('/auth/google', { idToken })
        persistirSessao(data)
      } finally {
        setIsLoading(false)
      }
    },
    [persistirSessao],
  )

  useEffect(() => {
    window.addEventListener('sgv:unauthorized', logout)
    return () => window.removeEventListener('sgv:unauthorized', logout)
  }, [logout])

  const value = useMemo<AuthContextValue>(
    () => ({
      usuario,
      isAuthenticated: usuario !== null,
      isLoading,
      login,
      loginWithGoogle,
      logout,
    }),
    [usuario, isLoading, login, loginWithGoogle, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}