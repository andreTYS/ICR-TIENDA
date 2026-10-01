import { NextResponse } from 'next/server'
import { fetchErpCatalogo, erpConfigured, erpImageUrl, type ErpProducto } from '@/lib/erp'
import type { Producto, SolucionId } from '@/data/products'

// El ERP ya tiene un campo de categoría de negocio real (ver
// inventoryService.setProductCategoria). Se usa cuando viene informado; si un
// producto todavía no la tiene cargada, se infiere por palabras clave del
// nombre como respaldo, para que igual caiga en algún filtro de la tienda.
function inferirCategoria(nombre: string): string {
  const n = nombre.toLowerCase()
  if (n.includes('panel') || n.includes('módulo') || n.includes('modulo')) return 'Panel solar'
  if (n.includes('batería') || n.includes('bateria')) return 'Batería'
  if (n.includes('inversor')) return 'Inversor'
  if (n.includes('riel') || n.includes('estructura') || n.includes('rack')) return 'Estructura'
  return 'Accesorios'
}

// El ERP trae ~38 categorías reales de negocio (catálogo mixto: solar +
// seguridad + networking), sin ninguna etiqueta de "solución" — ese concepto
// solo existía en el catálogo de demostración de 10 productos. Se deriva por
// palabras clave de la categoría, cubriendo tanto las categorías reales del
// ERP ("PANELES", "INVERSORES HIBRIDOS"...) como las de respaldo de
// inferirCategoria ("Panel solar", "Inversor"...). Categorías no solares
// (alarmas, cámaras, networking) quedan sin ninguna solución — es correcto:
// igual aparecen en "Todos los productos" y por categoría/búsqueda, solo no
// bajo un filtro de solución que no les corresponde.
function solucionesPorCategoria(categoria: string): SolucionId[] {
  const c = categoria.toUpperCase()
  const soluciones = new Set<SolucionId>()
  if (c.includes('PANEL')) ['autoconsumo', 'offgrid', 'respaldo'].forEach((s) => soluciones.add(s as SolucionId))
  if (c.includes('ESTRUCTURA')) ['autoconsumo', 'offgrid'].forEach((s) => soluciones.add(s as SolucionId))
  if (c.includes('CABLE') && c.includes('SOLAR')) ['autoconsumo', 'offgrid'].forEach((s) => soluciones.add(s as SolucionId))
  if (c.includes('INVERSOR')) {
    if (c.includes('RED')) soluciones.add('autoconsumo')
    else if (c.includes('HIBRID') || c.includes('HÍBRID')) ['respaldo', 'offgrid'].forEach((s) => soluciones.add(s as SolucionId))
    else if (c.includes('MICRO')) ['autoconsumo', 'monitoreo'].forEach((s) => soluciones.add(s as SolucionId))
    else ['respaldo', 'offgrid'].forEach((s) => soluciones.add(s as SolucionId)) // inversor genérico
  }
  if (c.includes('BATER')) ['respaldo', 'offgrid'].forEach((s) => soluciones.add(s as SolucionId))
  if (c.includes('CONTROLADOR')) ['offgrid', 'respaldo'].forEach((s) => soluciones.add(s as SolucionId))
  if (c.includes('SMART METER') || c.includes('MEDIDOR')) ['monitoreo', 'autoconsumo'].forEach((s) => soluciones.add(s as SolucionId))
  if (c === 'UPS') soluciones.add('respaldo')
  if (c.includes('BOMBA')) soluciones.add('offgrid')
  return Array.from(soluciones)
}

function mapearProducto(p: ErpProducto, stockDisponible: number): Producto {
  const precioVenta = p.precio_venta != null ? Number(p.precio_venta) : null
  const cat = p.categoria?.trim() || inferirCategoria(p.nombre)
  return {
    id: p.sku,
    marca: p.marca || 'ICR',
    cat,
    sku: p.sku,
    nombre: p.nombre,
    spec: [p.modelo, p.unidad_medida].filter(Boolean).join(' · '),
    precio: precioVenta ?? 0,
    stock: stockDisponible > 0 ? 'Disponible' : 'Consultar disponibilidad',
    b2b: false,
    desc: p.descripcion || '',
    specs: [
      ['SKU', p.sku],
      ['Marca', p.marca || '—'],
      ['Modelo', p.modelo || '—'],
      ['Unidad', p.unidad_medida],
    ] as [string, string][],
    soluciones: solucionesPorCategoria(cat),
    imagen: erpImageUrl(p.imagen_url),
    precioIndefinido: precioVenta == null,
    destacado: p.destacado === true,
  }
}

export async function GET() {
  if (!erpConfigured()) {
    return NextResponse.json({ live: false, productos: [] })
  }
  try {
    const { productos, stockPorSku } = await fetchErpCatalogo()
    const mapeados = productos.map((p) => mapearProducto(p, stockPorSku[p.sku] || 0))
    return NextResponse.json({ live: true, productos: mapeados })
  } catch (err) {
    console.error('No se pudo leer el catálogo del ERP, se usará el catálogo local de respaldo:', err)
    return NextResponse.json({ live: false, productos: [] })
  }
}
