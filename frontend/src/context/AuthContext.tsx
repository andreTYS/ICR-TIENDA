'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export interface Usuario {
  nombre: string
  correo: string
  empresa?: string
  telefono?: string
}

interface AuthContextValue {
  user: Usuario | null
  ready: boolean
  login: (data: Usuario) => void
  register: (data: Usuario) => void
  logout: () => void
  updateProfile: (data: Partial<Usuario>) => void
}

const STORAGE_KEY = 'icr_auth_user'

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) setUser(JSON.parse(raw))
    } catch {
      // localStorage no disponible (SSR/privado) - se queda deslogueado
    }
    setReady(true)
  }, [])

  const persist = (data: Usuario | null) => {
    setUser(data)
    try {
      if (data) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      else window.localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignorar si no hay storage disponible
    }
  }

  const value: AuthContextValue = {
    user,
    ready,
    login: (data) => persist(data),
    register: (data) => persist(data),
    logout: () => persist(null),
    updateProfile: (data) => {
      if (!user) return
      persist({ ...user, ...data })
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
