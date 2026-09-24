'use client'

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { PRODUCTOS, money } from '../data/products'

interface QuoteLine {
  id: string
  qty: number
}

interface QuoteContextValue {
  lines: Record<string, number>
  count: number
  totalMoney: string
  add: (id: string, qty?: number) => void
  bump: (id: string, delta: number) => void
  rows: {
    id: string
    marca: string
    sku: string
    nombre: string
    spec: string
    qty: number
    total: string
  }[]
}

const QuoteContext = createContext<QuoteContextValue | null>(null)

export function QuoteProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<Record<string, number>>({ deye8k: 1, pylontech: 4, jinko: 12 })

  const add = useCallback((id: string, qty = 1) => {
    setLines((prev) => ({ ...prev, [id]: (prev[id] || 0) + qty }))
  }, [])

  const bump = useCallback((id: string, delta: number) => {
    setLines((prev) => {
      const next = { ...prev }
      const val = (next[id] || 0) + delta
      if (val < 1) {
        delete next[id]
      } else {
        next[id] = val
      }
      return next
    })
  }, [])

  const value = useMemo<QuoteContextValue>(() => {
    const rows = Object.entries(lines)
      .map(([id, qty]) => {
        const p = PRODUCTOS.find((x) => x.id === id)
        if (!p) return null
        return {
          id,
          marca: p.marca,
          sku: p.sku,
          nombre: p.nombre,
          spec: p.spec,
          qty,
          total: money(p.precio * qty),
        }
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)

    const totalNum = rows.reduce((t, r) => {
      const p = PRODUCTOS.find((x) => x.id === r.id)!
      return t + p.precio * r.qty
    }, 0)

    const count = Object.values(lines).reduce((t, q) => t + q, 0)

    return { lines, count, totalMoney: money(totalNum), add, bump, rows }
  }, [lines, add, bump])

  return <QuoteContext.Provider value={value}>{children}</QuoteContext.Provider>
}

export function useQuote() {
  const ctx = useContext(QuoteContext)
  if (!ctx) throw new Error('useQuote debe usarse dentro de QuoteProvider')
  return ctx
}

export type { QuoteLine }
