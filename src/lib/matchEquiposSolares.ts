// Empareja los resultados del dimensionador con equipos REALES del catálogo
// de la tienda (los 800 productos importados del ERP) — no existe un
// catálogo estructurado con columnas Wp/kW/V/Ah como en el Excel, así que
// estas funciones parsean esos datos desde el nombre real del producto
// (ej. "570W PANEL SOLAR TRINA...", "3KW INVERSOR RED GROWATT",
// "12V 100AH BATERIA LITIO"). Si un nombre no se puede interpretar, ese
// producto simplemente no entra como candidato — nunca revienta.
import type { Producto } from '@/data/products'
import type { TipoSistema } from './dimensionadorSolar'

export function parsearWpPanel(nombre: string): number | null {
  const m = nombre.match(/(\d{2,4})\s*w(?:p)?\b/i)
  return m ? Number(m[1]) : null
}

// Formatos vistos en el catálogo real: "3KW...", "1000W...", "24/3000..."
// (segundo número es VA), "48V 2000VA...".
export function parsearKwInversor(nombre: string): number | null {
  const kw = nombre.match(/(\d+(?:[.,]\d+)?)\s*kw/i)
  if (kw) return Number(kw[1].replace(',', '.'))
  const relacion = nombre.match(/\b(\d{2,3})\s*\/\s*(\d{3,5})\b/) // "24/3000"
  if (relacion) return Number(relacion[2]) / 1000
  const va = nombre.match(/(\d{3,5})\s*va\b/i)
  if (va) return Number(va[1]) / 1000
  const w = nombre.match(/(\d{3,5})\s*w\b/i)
  if (w) return Number(w[1]) / 1000
  return null
}

export interface BateriaParseada {
  voltaje: number
  ah: number
  kwh: number
}

// Formatos vistos: "12V 100AH...", "12V-150AH...", "12/100 Ah...".
export function parsearBateria(nombre: string): BateriaParseada | null {
  let m = nombre.match(/(\d{1,3})\s*\/\s*(\d{1,4})\s*a\s*h/i)
  if (!m) m = nombre.match(/(\d{1,3})\s*v[\s-]*(\d{1,4})\s*a\s*h/i)
  if (!m) return null
  const voltaje = Number(m[1])
  const ah = Number(m[2])
  if (!voltaje || !ah) return null
  return { voltaje, ah, kwh: (voltaje * ah) / 1000 }
}

export function esLitio(nombre: string): boolean {
  return /litio|lifepo4|li-?ion/i.test(nombre)
}

export function esTrifasico(nombre: string): boolean {
  return /trif[aá]sic|3\s*f\b/i.test(nombre)
}

export interface SugerenciaPanel {
  producto: Producto
  wp: number
}

// El más chico que iguale o supere el objetivo (mismo criterio que el
// Excel: "el más chico que cumpla"); si ninguno alcanza, el más grande
// disponible.
export function sugerirPanel(productos: Producto[], wpObjetivo: number): SugerenciaPanel | null {
  const candidatos = productos
    .filter((p) => p.cat === 'PANELES')
    .map((p) => ({ producto: p, wp: parsearWpPanel(p.nombre) }))
    .filter((c): c is SugerenciaPanel => c.wp !== null && c.wp > 0)
  if (candidatos.length === 0) return null
  const queCumplen = candidatos.filter((c) => c.wp >= wpObjetivo).sort((a, b) => a.wp - b.wp)
  if (queCumplen.length > 0) return queCumplen[0]
  return [...candidatos].sort((a, b) => b.wp - a.wp)[0]
}

// Paneles disponibles ordenados por Wp, sin duplicar potencias — para
// dejar elegir al visitante qué panel usar en el cálculo.
export function panelesDisponibles(productos: Producto[]): SugerenciaPanel[] {
  const vistos = new Set<number>()
  const resultado: SugerenciaPanel[] = []
  for (const p of productos) {
    if (p.cat !== 'PANELES') continue
    const wp = parsearWpPanel(p.nombre)
    if (!wp || vistos.has(wp)) continue
    vistos.add(wp)
    resultado.push({ producto: p, wp })
  }
  return resultado.sort((a, b) => a.wp - b.wp)
}

export interface SugerenciaInversor {
  producto: Producto
  kw: number
}

const CATEGORIAS_INVERSOR: Record<TipoSistema, string[]> = {
  'ON-GRID': ['INVERSORES DE RED'],
  HIBRIDO: ['INVERSORES HIBRIDOS', 'INVERSORES'],
  'OFF-GRID': ['INVERSORES HIBRIDOS', 'INVERSORES'],
}

export function sugerirInversor(productos: Producto[], tipo: TipoSistema, kwMinimo: number): SugerenciaInversor | null {
  const categorias = CATEGORIAS_INVERSOR[tipo]
  const candidatos = productos
    .filter((p) => categorias.includes(p.cat))
    .map((p) => ({ producto: p, kw: parsearKwInversor(p.nombre) }))
    .filter((c): c is SugerenciaInversor => c.kw !== null && c.kw > 0)
  if (candidatos.length === 0) return null
  const queCumplen = candidatos.filter((c) => c.kw >= kwMinimo).sort((a, b) => a.kw - b.kw)
  if (queCumplen.length > 0) return queCumplen[0]
  return [...candidatos].sort((a, b) => b.kw - a.kw)[0]
}

export interface SugerenciaBateria {
  producto: Producto
  cantidad: number
  kwhUnidad: number
}

// Prioriza litio y mayor voltaje (menos unidades, banco más ordenado);
// cantidad = ceil(kWh requerido ÷ kWh por unidad), mínimo 1.
export function sugerirBateria(productos: Producto[], kwhRequerido: number): SugerenciaBateria | null {
  if (kwhRequerido <= 0) return null
  const candidatos = productos
    .filter((p) => p.cat === 'BATERIAS')
    .map((p) => {
      const parseada = parsearBateria(p.nombre)
      return parseada ? { producto: p, ...parseada } : null
    })
    .filter((c): c is { producto: Producto } & BateriaParseada => c !== null && c.kwh > 0)
  if (candidatos.length === 0) return null

  candidatos.sort((a, b) => {
    const litioA = esLitio(a.producto.nombre) ? 1 : 0
    const litioB = esLitio(b.producto.nombre) ? 1 : 0
    if (litioA !== litioB) return litioB - litioA
    return b.voltaje - a.voltaje
  })
  const elegida = candidatos[0]
  return {
    producto: elegida.producto,
    cantidad: Math.max(1, Math.ceil(kwhRequerido / elegida.kwh)),
    kwhUnidad: elegida.kwh,
  }
}

export interface EquipamientoSugerido {
  panel: SugerenciaPanel | null
  cantidadPaneles: number
  inversor: SugerenciaInversor | null
  bateria: SugerenciaBateria | null
}

// Estructura, cableado, protecciones y mano de obra no se emparejan
// SKU-por-SKU contra el catálogo real (esa granularidad la resuelve el
// presupuesto interno de ICR) — se estima como un porcentaje adicional
// sobre el equipamiento principal, mostrado siempre como "estimado".
export const FACTOR_INSTALACION_Y_MATERIALES = 1.35

export function calcularInversionEstimada(equipo: EquipamientoSugerido): number {
  const precioPaneles = equipo.panel ? equipo.panel.producto.precio * equipo.cantidadPaneles : 0
  const precioInversor = equipo.inversor ? equipo.inversor.producto.precio : 0
  const precioBateria = equipo.bateria ? equipo.bateria.producto.precio * equipo.bateria.cantidad : 0
  const subtotal = precioPaneles + precioInversor + precioBateria
  return subtotal * FACTOR_INSTALACION_Y_MATERIALES
}
