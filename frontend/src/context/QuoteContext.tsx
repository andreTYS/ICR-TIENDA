'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { money, titleCase, type Producto } from '../data/products'

// Cada línea guarda una copia del producto al momento de agregarlo, así la
// cotización no depende de volver a pedir el catálogo. El precio final lo
// recalcula el backend con la base al recibir la solicitud.
interface QuoteLine {
  id: number
  nombre: string
  marca: string
  sku: string
  spec: string
  precio: number
  qty: number
}

interface QuoteContextValue {
  count: number
  total: number
  totalMoney: string
  add: (p: Producto, qty?: number) => void
  bump: (id: number, delta: number) => void
  clear: () => void
  rows: (QuoteLine & { subtotal: string })[]
}

const STORAGE_KEY = 'icr-cotizacion'
const QuoteContext = createContext<QuoteContextValue | null>(null)

export function QuoteProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<QuoteLine[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
      if (Array.isArray(saved)) setLines(saved.filter((l) => typeof l?.id === 'number'))
    } catch {
      /* almacenamiento no disponible */
    }
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (!loaded) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines))
    } catch {
      /* almacenamiento no disponible */
    }
  }, [lines, loaded])

  const add = useCallback((p: Producto, qty = 1) => {
    setLines((prev) => {
      const i = prev.findIndex((l) => l.id === p.id)
      if (i >= 0) return prev.map((l, j) => (j === i ? { ...l, qty: l.qty + qty } : l))
      return [
        ...prev,
        {
          id: p.id,
          nombre: p.nombre,
          marca: p.marca || titleCase(p.categoria_producto),
          sku: p.referencia_interna || `ICR-${p.id}`,
          spec: titleCase(p.categoria_producto),
          precio: p.precio_venta || 0,
          qty,
        },
      ]
    })
  }, [])

  const bump = useCallback((id: number, delta: number) => {
    setLines((prev) =>
      prev.flatMap((l) => {
        if (l.id !== id) return [l]
        const qty = l.qty + delta
        return qty < 1 ? [] : [{ ...l, qty }]
      }),
    )
  }, [])

  const clear = useCallback(() => setLines([]), [])

  const value = useMemo<QuoteContextValue>(() => {
    const total = lines.reduce((t, l) => t + l.precio * l.qty, 0)
    return {
      count: lines.reduce((t, l) => t + l.qty, 0),
      total,
      totalMoney: money(total),
      add,
      bump,
      clear,
      rows: lines.map((l) => ({ ...l, subtotal: money(l.precio * l.qty) })),
    }
  }, [lines, add, bump, clear])

  return <QuoteContext.Provider value={value}>{children}</QuoteContext.Provider>
}

export function useQuote() {
  const ctx = useContext(QuoteContext)
  if (!ctx) throw new Error('useQuote debe usarse dentro de QuoteProvider')
  return ctx
}

export type { QuoteLine }
