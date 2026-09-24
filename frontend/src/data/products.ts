export type SolucionId = 'respaldo' | 'autoconsumo' | 'offgrid' | 'monitoreo'

// Producto tal como lo devuelve la API de la tienda (backend/, tabla productos).
// El stock viene del ERP (erp.inversionesicr.com); null = el ERP no lo conoce.
export interface Producto {
  id: number
  nombre: string
  referencia_interna: string | null
  categoria_producto: string | null
  unidad_medida: string | null
  precio_venta: number | null
  descripcion: string | null
  imagen_url: string | null
  marca: string | null
  soluciones: SolucionId[]
  stock_erp: number | null
  destacado: boolean
  vendidos?: number | null
}

export interface ProductoDetalle extends Producto {
  relacionados: Producto[]
}

export const money = (n: number) => 'S/ ' + n.toLocaleString('es-PE')

export const SOLUCIONES: { id: SolucionId; nombre: string; desc: string; meta: string }[] = [
  {
    id: 'respaldo',
    nombre: 'Respaldo energético',
    desc: 'Continuidad de cargas críticas ante falla o inestabilidad de red.',
    meta: 'Baterías · Híbridos · Transferencia',
  },
  {
    id: 'autoconsumo',
    nombre: 'Autoconsumo en red',
    desc: 'Reducción de factura con generación solar conectada y medición bidireccional.',
    meta: 'On-grid · Medidores · Estructura',
  },
  {
    id: 'offgrid',
    nombre: 'Sistemas off-grid y on-grid',
    desc: 'Energía donde la red no llega, y generación conectada donde sí: telecom, agro, obra y zonas aisladas.',
    meta: 'Aislado · Bancos · Controladores',
  },
  {
    id: 'monitoreo',
    nombre: 'Monitoreo y calidad',
    desc: 'Medición, alarmas y control de planta para operar con datos.',
    meta: 'Datahub · Sensores · Analítica',
  },
]

export function stockLabel(p: Pick<Producto, 'stock_erp'>): { texto: string; tono: 'ok' | 'pedido' | 'consultar' } {
  if (p.stock_erp == null) return { texto: 'Consultar disponibilidad', tono: 'consultar' }
  if (p.stock_erp > 0) return { texto: `En stock · ${p.stock_erp} und.`, tono: 'ok' }
  return { texto: 'A pedido', tono: 'pedido' }
}

// Categorías de la base → nombre legible en la tienda
export const titleCase = (s: string | null | undefined) =>
  (s || '')
    .toLowerCase()
    .replace(/(^|[\s/(-])([a-záéíóúñ])/g, (_m, a, b) => a + b.toUpperCase())
    .replace(/\bIp\b/g, 'IP')
    .replace(/\bNvr\b/g, 'NVR')
    .replace(/\bDvr\b/g, 'DVR')
    .replace(/\bHdd\b/g, 'HDD')
    .replace(/\bUps\b/g, 'UPS')
