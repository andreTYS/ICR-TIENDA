// Cliente server-side hacia la API del ERP (ICR-LOGISTICA). Nunca se importa
// desde un componente 'use client' — el token de servicio (ERP_API_TOKEN)
// solo debe vivir en el servidor de Next.js, jamás llegar al navegador.
// Sigue el mismo patrón que ya usa N8N para integrarse con el ERP: un
// usuario de servicio real (rol VENTAS) con un token de larga duración
// emitido desde Administración → Tokens de servicio.

function isConfigured(): boolean {
  return !!process.env.ERP_API_URL && !!process.env.ERP_API_TOKEN
}

// El ERP devuelve imagen_url como ruta relativa (ej. "/uploads/xxx.jpg"),
// pensada para servirse desde su propio dominio (ver backend/src/uploads.js
// en ICR-LOGISTICA) — nunca una URL absoluta. Si se usara tal cual en un
// <img src>, el navegador la resuelve contra el dominio de la TIENDA, no el
// del ERP, y la imagen sale rota. Se arma la URL absoluta contra el origen
// real del ERP (mismo host que ERP_API_URL, sin el sufijo /api).
function erpImageUrl(imagenUrl: string | null): string | null {
  if (!imagenUrl) return null
  if (/^https?:\/\//i.test(imagenUrl)) return imagenUrl
  const apiUrl = process.env.ERP_API_URL
  if (!apiUrl) return null
  return new URL(imagenUrl, new URL(apiUrl).origin).toString()
}

async function erpFetch(path: string, init?: RequestInit): Promise<Response> {
  const baseUrl = (process.env.ERP_API_URL || '').replace(/\/+$/, '')
  return fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.ERP_API_TOKEN}`,
      ...(init?.headers || {}),
    },
    // El catálogo cambia poco durante el día — cachear 60s reduce carga sobre
    // el ERP sin que los precios/stock se vean desactualizados en la práctica.
    next: { revalidate: 60 },
  })
}

export interface ErpProducto {
  producto_id: string
  sku: string
  nombre: string
  descripcion: string | null
  marca: string | null
  modelo: string | null
  unidad_medida: string
  costo_unitario: number | string | null
  precio_venta: number | string | null
  categoria: string | null
  imagen_url: string | null
}

export interface ErpStockRow {
  sku: string
  stock_disponible: number | string
}

// Trae el catálogo completo (paginado por el ERP hasta 500 a la vez) y el
// stock agregado por SKU en paralelo. Lanza si el ERP no está configurado o
// responde con error — el llamador (route handler) decide el fallback.
export async function fetchErpCatalogo(): Promise<{ productos: ErpProducto[]; stockPorSku: Record<string, number> }> {
  if (!isConfigured()) {
    throw new Error('ERP_API_URL/ERP_API_TOKEN no configurados')
  }

  const [productosRes, stockRes] = await Promise.all([
    erpFetch('/inventory/products?page_size=500'),
    erpFetch('/inventory/stock?page_size=500'),
  ])

  if (!productosRes.ok) throw new Error(`ERP /inventory/products respondió ${productosRes.status}`)
  if (!stockRes.ok) throw new Error(`ERP /inventory/stock respondió ${stockRes.status}`)

  const productosBody = await productosRes.json()
  const stockBody = await stockRes.json()

  const productos: ErpProducto[] = productosBody?.data?.items || []
  const stockRows: ErpStockRow[] = stockBody?.data?.items || []

  const stockPorSku: Record<string, number> = {}
  for (const row of stockRows) {
    const actual = stockPorSku[row.sku] || 0
    stockPorSku[row.sku] = actual + Number(row.stock_disponible || 0)
  }

  return { productos, stockPorSku }
}

export interface SolicitudCotizacion {
  nombreContacto: string
  empresa?: string
  email?: string
  telefono?: string
  notas: string
}

// Crea un Lead en el CRM del ERP (origen WEB) — no un cliente ni una
// cotización formal: un vendedor lo revisa y sigue el proceso normal desde
// el ERP. Reusa POST /crm/leads tal cual, con el token de servicio.
export async function crearLeadDesdeWeb(solicitud: SolicitudCotizacion): Promise<{ codigo: string }> {
  if (!isConfigured()) {
    throw new Error('ERP_API_URL/ERP_API_TOKEN no configurados')
  }
  const res = await erpFetch('/crm/leads', {
    method: 'POST',
    cache: 'no-store',
    body: JSON.stringify({
      channel: 'web-tienda',
      nombre_contacto: solicitud.nombreContacto,
      empresa: solicitud.empresa || null,
      email: solicitud.email || null,
      telefono: solicitud.telefono || null,
      origen: 'WEB',
      notas: solicitud.notas,
    }),
  })
  const body = await res.json().catch(() => null)
  if (!res.ok || body?.status !== 'success') {
    throw new Error(body?.error?.message || `ERP /crm/leads respondió ${res.status}`)
  }
  return { codigo: body.data.lead.codigo }
}

export { isConfigured as erpConfigured, erpImageUrl }
