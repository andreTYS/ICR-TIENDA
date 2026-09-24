import type { Producto, ProductoDetalle } from '@/data/products'

// En el navegador, /api y /uploads van por el mismo dominio (Traefik los
// enruta al backend). En el servidor de Next se llama directo al contenedor.
const base = () =>
  typeof window === 'undefined' ? process.env.API_INTERNAL_URL || 'http://backend:4000' : ''

async function get<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${base()}${path}`, { cache: 'no-store', ...init })
  if (!res.ok) throw new Error(`HTTP ${res.status} en ${path}`)
  return res.json()
}

export interface ListaProductos {
  productos: Producto[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface Filtros {
  categorias: { nombre: string; n: number }[]
  marcas: { nombre: string; n: number }[]
}

export interface Portada {
  destacados: Producto[]
  masVendidos: Producto[]
  fuenteMasVendidos: 'erp' | 'catalogo'
}

export const api = {
  productos: (params: URLSearchParams) => {
    params.set('tienda', '1')
    return get<ListaProductos>(`/api/productos?${params.toString()}`)
  },
  producto: (id: string | number) => get<ProductoDetalle>(`/api/productos/${id}`),
  filtros: () => get<Filtros>('/api/categorias'),
  portada: (n = 3) => get<Portada>(`/api/destacados?n=${n}`),
  cotizar: async (body: unknown) => {
    const res = await fetch('/api/cotizaciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || 'No se pudo enviar la solicitud')
    return data as { codigo: string; total: number; erp_lead: string | null }
  },
}
