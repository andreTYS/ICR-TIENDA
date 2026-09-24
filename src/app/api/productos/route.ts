import { NextResponse } from 'next/server'
import { fetchErpCatalogo, erpConfigured, erpImageUrl, type ErpProducto } from '@/lib/erp'
import type { Producto } from '@/data/products'

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

function mapearProducto(p: ErpProducto, stockDisponible: number): Producto {
  const precioVenta = p.precio_venta != null ? Number(p.precio_venta) : null
  return {
    id: p.sku,
    marca: p.marca || 'ICR',
    cat: p.categoria?.trim() || inferirCategoria(p.nombre),
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
    soluciones: [],
    imagen: erpImageUrl(p.imagen_url),
    precioIndefinido: precioVenta == null,
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
