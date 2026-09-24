'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { PRODUCTOS as PRODUCTOS_RESPALDO, type Producto } from '../data/products'

interface ProductsContextValue {
  productos: Producto[]
  loading: boolean
  /** true si los productos vienen del ERP en vivo; false si se está usando el catálogo local de respaldo. */
  live: boolean
}

const ProductsContext = createContext<ProductsContextValue | null>(null)

// Se muestra el catálogo local de respaldo de inmediato (sin pantalla en
// blanco) y, si el ERP responde con datos reales, se reemplaza en silencio
// — mismo criterio de "no configurado no rompe nada" que el resto del ERP.
export function ProductsProvider({ children }: { children: ReactNode }) {
  const [productos, setProductos] = useState<Producto[]>(PRODUCTOS_RESPALDO)
  const [loading, setLoading] = useState(true)
  const [live, setLive] = useState(false)

  useEffect(() => {
    let cancelado = false
    fetch('/api/productos')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`status ${r.status}`))))
      .then((data: { live: boolean; productos: Producto[] }) => {
        if (cancelado) return
        if (data.live && Array.isArray(data.productos) && data.productos.length > 0) {
          setProductos(data.productos)
          setLive(true)
        }
      })
      .catch((err) => console.error('No se pudo cargar el catálogo en vivo del ERP, se mantiene el local:', err))
      .finally(() => {
        if (!cancelado) setLoading(false)
      })
    return () => {
      cancelado = true
    }
  }, [])

  return <ProductsContext.Provider value={{ productos, loading, live }}>{children}</ProductsContext.Provider>
}

export function useProducts() {
  const ctx = useContext(ProductsContext)
  if (!ctx) throw new Error('useProducts debe usarse dentro de ProductsProvider')
  return ctx
}
