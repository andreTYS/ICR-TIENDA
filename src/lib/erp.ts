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
  destacado?: boolean
}

export interface ErpStockRow {
  sku: string
  stock_disponible: number | string
}

// El ERP limita cada página a 500 filas como máximo (tope duro en
// inventoryService.paginationParams), sin importar el page_size pedido — con
// más de 500 productos (hoy ~800) hay que pedir varias páginas y juntarlas.
// Antes esta función solo pedía la página 1 y se quedaba ahí: la tienda
// mostraba de menos, silenciosamente, sin ningún error.
async function fetchTodasLasPaginas<T>(path: string): Promise<T[]> {
  const items: T[] = []
  const MAX_PAGINAS = 50 // 25.000 filas a 500/página — muy por encima de lo real, solo para nunca quedar en loop infinito
  for (let page = 1; page <= MAX_PAGINAS; page++) {
    const res = await erpFetch(`${path}${path.includes('?') ? '&' : '?'}page=${page}&page_size=500`)
    if (!res.ok) throw new Error(`ERP ${path} respondió ${res.status}`)
    const body = await res.json()
    const pageItems: T[] = body?.data?.items || []
    items.push(...pageItems)
    const total = Number(body?.data?.total || 0)
    if (pageItems.length === 0 || items.length >= total) break
  }
  return items
}

// Trae el catálogo completo (paginando todas las páginas que hagan falta) y
// el stock agregado por SKU en paralelo. Lanza si el ERP no está configurado
// o responde con error — el llamador (route handler) decide el fallback.
export async function fetchErpCatalogo(): Promise<{ productos: ErpProducto[]; stockPorSku: Record<string, number> }> {
  if (!isConfigured()) {
    throw new Error('ERP_API_URL/ERP_API_TOKEN no configurados')
  }

  const [productos, stockRows] = await Promise.all([
    fetchTodasLasPaginas<ErpProducto>('/inventory/products'),
    fetchTodasLasPaginas<ErpStockRow>('/inventory/stock'),
  ])

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
//
// `channel` viaja hasta auditoria.canal en el ERP, que solo admite
// 'web'/'telegram'/'api'/'n8n' (CHECK de db/schema.sql) — 'web-tienda' violaba
// esa restricción y hacía fallar SIEMPRE esta creación de lead, sin que se
// notara porque el error solo aparecía en los logs del backend, nunca en la
// tienda. La distinción "vino de la tienda pública" ya queda registrada en
// el propio lead vía `origen: 'WEB'`, así que 'web' alcanza para el canal.
export async function crearLeadDesdeWeb(solicitud: SolicitudCotizacion): Promise<{ codigo: string }> {
  if (!isConfigured()) {
    throw new Error('ERP_API_URL/ERP_API_TOKEN no configurados')
  }
  const res = await erpFetch('/crm/leads', {
    method: 'POST',
    cache: 'no-store',
    body: JSON.stringify({
      channel: 'web',
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

// ---------- Cuentas de tienda (login/registro/historial de pedidos) ----------
// El navegador nunca llama al ERP directo (ver nota de archivo): estas
// funciones las usan únicamente las rutas /api/auth/* de Next.js, que sí
// corren en el servidor. registro/login van con el token de servicio de
// siempre (igual que crearLeadDesdeWeb); obtenerPedidos en cambio reenvía el
// JWT propio del cliente de tienda que emite el ERP al loguearse — por eso
// recibe `tokenCliente` y lo manda como Authorization, pisando el token de
// servicio por defecto de erpFetch.

export interface TiendaAuthUser {
  nombre: string
  correo: string
  telefono: string | null
  empresa: string | null
  ruc: string | null
  dni: string | null
}

export interface TiendaAuthSesion {
  token: string
  user: TiendaAuthUser
}

export interface RegistroClienteTienda {
  nombre: string
  correo: string
  password: string
  telefono?: string
  empresa?: string
  ruc?: string
  dni?: string
}

async function leerRespuestaAuth(res: Response): Promise<TiendaAuthSesion> {
  const body = await res.json().catch(() => null)
  if (!res.ok || body?.status !== "success") {
    throw new Error(body?.error?.message || `ERP respondió ${res.status}`)
  }
  return body.data
}

export async function registrarClienteTienda(datos: RegistroClienteTienda): Promise<TiendaAuthSesion> {
  if (!isConfigured()) throw new Error("La tienda todavía no está conectada al ERP")
  const res = await erpFetch("/tienda-auth/registro", { method: "POST", cache: "no-store", body: JSON.stringify(datos) })
  return leerRespuestaAuth(res)
}

export async function loginClienteTienda(correo: string, password: string): Promise<TiendaAuthSesion> {
  if (!isConfigured()) throw new Error("La tienda todavía no está conectada al ERP")
  const res = await erpFetch("/tienda-auth/login", { method: "POST", cache: "no-store", body: JSON.stringify({ correo, password }) })
  return leerRespuestaAuth(res)
}

export async function actualizarPerfilTienda(
  tokenCliente: string,
  datos: { nombre: string; telefono?: string; empresa?: string; ruc?: string; dni?: string }
): Promise<TiendaAuthSesion> {
  if (!isConfigured()) throw new Error("La tienda todavía no está conectada al ERP")
  const res = await erpFetch("/tienda-auth/perfil", {
    method: "POST",
    cache: "no-store",
    headers: { Authorization: `Bearer ${tokenCliente}` },
    body: JSON.stringify(datos),
  })
  return leerRespuestaAuth(res)
}

export interface PedidoTienda {
  codigo: string
  tipo: "COTIZACION" | "CONTRATO"
  estado: string
  fecha: string
  monto: number | string
}

export async function obtenerPedidosTienda(tokenCliente: string): Promise<{ pedidos: PedidoTienda[]; razonSocial?: string }> {
  if (!isConfigured()) throw new Error("La tienda todavía no está conectada al ERP")
  const res = await erpFetch("/tienda-auth/pedidos", { cache: "no-store", headers: { Authorization: `Bearer ${tokenCliente}` } })
  const body = await res.json().catch(() => null)
  if (!res.ok || body?.status !== "success") {
    throw new Error(body?.error?.message || `ERP respondió ${res.status}`)
  }
  return body.data
}

export { isConfigured as erpConfigured, erpImageUrl }
