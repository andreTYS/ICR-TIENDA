'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export interface Usuario {
  nombre: string
  correo: string
  empresa?: string | null
  telefono?: string | null
  ruc?: string | null
  dni?: string | null
}

export interface RegistroInput {
  nombre: string
  correo: string
  password: string
  empresa?: string
  telefono?: string
  ruc?: string
  dni?: string
}

export interface PerfilInput {
  nombre: string
  telefono?: string
  empresa?: string
  ruc?: string
  dni?: string
}

interface AuthContextValue {
  user: Usuario | null
  token: string | null
  ready: boolean
  login: (correo: string, password: string) => Promise<void>
  register: (data: RegistroInput) => Promise<void>
  updateProfile: (data: PerfilInput) => Promise<void>
  logout: () => void
}

const STORAGE_KEY = 'icr_auth_session'

const AuthContext = createContext<AuthContextValue | null>(null)

interface Sesion {
  token: string
  user: Usuario
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<Sesion | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) setSesion(JSON.parse(raw))
    } catch {
      // localStorage no disponible (SSR/privado) - se queda deslogueado
    }
    setReady(true)
  }, [])

  const persist = (data: Sesion | null) => {
    setSesion(data)
    try {
      if (data) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      else window.localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignorar si no hay storage disponible
    }
  }

  // Lanza con el mensaje de error real del ERP (RUC duplicado, contraseña
  // incorrecta, etc.) para que login/registro lo muestren tal cual, en vez
  // de un "algo salió mal" genérico.
  const llamarAuth = async (path: string, body: unknown): Promise<Sesion> => {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => null)
    if (!res.ok || data?.status !== 'success') {
      throw new Error(data?.error || 'No se pudo completar la solicitud')
    }
    return { token: data.token, user: data.user }
  }

  const value: AuthContextValue = {
    user: sesion?.user ?? null,
    token: sesion?.token ?? null,
    ready,
    login: async (correo, password) => {
      const nueva = await llamarAuth('/api/auth/login', { correo, password })
      persist(nueva)
    },
    register: async (datos) => {
      const nueva = await llamarAuth('/api/auth/registro', datos)
      persist(nueva)
    },
    updateProfile: async (datos) => {
      if (!sesion) throw new Error('No hay sesión activa')
      const res = await fetch('/api/auth/perfil', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sesion.token}` },
        body: JSON.stringify(datos),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || data?.status !== 'success') {
        throw new Error(data?.error || 'No se pudo actualizar el perfil')
      }
      persist({ token: data.token, user: data.user })
    },
    logout: () => persist(null),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
