'use client'

import { useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import ProductCard from '@/components/ProductCard'
import Container from '@/components/Container'
import { SOLUCIONES, type SolucionId } from '@/data/products'
import { useProducts } from '@/context/ProductsContext'

export default function CatalogoClient() {
  const { productos: PRODUCTOS } = useProducts()
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const solucion = (searchParams.get('solucion') as SolucionId | null) ?? null
  const q = searchParams.get('q') ?? ''

  const [categorias, setCategorias] = useState<string[]>(
    searchParams.get('cat') ? [searchParams.get('cat')!] : [],
  )
  const [marcas, setMarcas] = useState<string[]>([])

  // Las categorías y marcas del panel se calculan de los productos que
  // realmente están cargados (los 800 del ERP en vivo, o el catálogo de
  // respaldo si el ERP no responde) — nunca una lista fija, porque el ERP
  // usa decenas de categorías de negocio reales (PANELES, BATERIAS,
  // INVERSORES HIBRIDOS...) que no coinciden con ningún catálogo de muestra.
  const categoriasDisponibles = useMemo(() => {
    const conteo = new Map<string, number>()
    for (const p of PRODUCTOS) conteo.set(p.cat, (conteo.get(p.cat) || 0) + 1)
    return Array.from(conteo.entries()).sort((a, b) => b[1] - a[1])
  }, [PRODUCTOS])

  const marcasDisponibles = useMemo(() => {
    const conteo = new Map<string, number>()
    for (const p of PRODUCTOS) {
      const m = p.marca.toUpperCase()
      conteo.set(m, (conteo.get(m) || 0) + 1)
    }
    return Array.from(conteo.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [PRODUCTOS])

  const conteoPorSolucion = useMemo(() => {
    const conteo = new Map<SolucionId, number>()
    for (const p of PRODUCTOS) for (const s of p.soluciones) conteo.set(s, (conteo.get(s) || 0) + 1)
    return conteo
  }, [PRODUCTOS])

  const toggle = (list: string[], set: (v: string[]) => void, value: string) => {
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value])
  }

  const setSolucion = (id: SolucionId | null) => {
    const next = new URLSearchParams(searchParams.toString())
    if (id) next.set('solucion', id)
    else next.delete('solucion')
    router.push(`${pathname}?${next.toString()}`)
  }

  const productos = useMemo(() => {
    return PRODUCTOS.filter((p) => {
      if (q && !`${p.nombre} ${p.marca} ${p.sku}`.toLowerCase().includes(q.toLowerCase())) return false
      if (solucion && !p.soluciones.includes(solucion)) return false
      if (categorias.length && !categorias.includes(p.cat)) return false
      if (marcas.length && !marcas.includes(p.marca.toUpperCase())) return false
      return true
    })
  }, [PRODUCTOS, q, solucion, categorias, marcas])

  return (
    <Container className="pt-6">
      <div className="text-[11px] font-medium tracking-[.1em] uppercase text-ink/45 mb-4">
        Inicio / Tienda / <span className="text-ink">Todos los productos</span>
      </div>
      <div className="flex flex-wrap gap-4 items-end justify-between border-b border-ink/[.14] pb-5">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black uppercase leading-none mb-2">Catálogo técnico</h1>
          <p className="text-[13px] text-ink/60 m-0">
            Precios en soles con IGV. Para volumen o proyecto, solicita cotización.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2.5 py-5 overflow-x-auto">
        <button
          onClick={() => setSolucion(null)}
          className={`font-heading text-[11px] font-bold tracking-[.08em] uppercase px-4 py-2.5 whitespace-nowrap border border-ink/20 hover:border-accent transition-colors ${
            !solucion ? 'bg-ink text-white' : 'bg-transparent text-ink'
          }`}
        >
          Todas las soluciones
          <span className={`ml-1.5 ${!solucion ? 'text-white/60' : 'text-ink/40'}`}>({PRODUCTOS.length})</span>
        </button>
        {SOLUCIONES.map((s) => (
          <button
            key={s.id}
            onClick={() => setSolucion(s.id)}
            className={`font-heading text-[11px] font-bold tracking-[.08em] uppercase px-4 py-2.5 whitespace-nowrap border border-ink/20 hover:border-accent transition-colors flex items-center gap-2 ${
              solucion === s.id ? 'bg-ink text-white' : 'bg-transparent text-ink'
            }`}
          >
            <span className="text-accent text-sm normal-case">{s.icono}</span>
            {s.nombre}
            <span className={solucion === s.id ? 'text-white/60' : 'text-ink/40'}>
              ({conteoPorSolucion.get(s.id) || 0})
            </span>
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-[260px_1fr] gap-6 items-start pb-16">
        <aside className="border border-ink/[.14] p-[18px] lg:sticky lg:top-[220px]">
          {(categorias.length > 0 || marcas.length > 0) && (
            <button
              onClick={() => {
                setCategorias([])
                setMarcas([])
              }}
              className="mb-4 text-[11px] font-bold tracking-[.08em] uppercase text-accent-dark hover:text-ink transition-colors"
            >
              ✕ Quitar filtros
            </button>
          )}
          <FilterGroup
            titulo="Categoría"
            opciones={categoriasDisponibles.map(([nombre, n]) => ({ n: nombre, c: n, value: nombre }))}
            selected={categorias}
            onToggle={(v) => toggle(categorias, setCategorias, v)}
            maxAltura
          />
          <FilterGroup
            titulo="Marca"
            opciones={marcasDisponibles.map(([nombre, n]) => ({ n: nombre, c: n, value: nombre }))}
            selected={marcas}
            onToggle={(v) => toggle(marcas, setMarcas, v)}
            maxAltura
          />
        </aside>

        <div>
          {productos.length === 0 ? (
            <div className="text-center py-20 text-ink/50 text-sm">
              No hay productos que coincidan con los filtros seleccionados.
              <div className="mt-3">
                <button
                  onClick={() => {
                    setCategorias([])
                    setMarcas([])
                    setSolucion(null)
                  }}
                  className="text-[11px] font-bold tracking-[.08em] uppercase text-accent-dark hover:text-ink transition-colors"
                >
                  Quitar todos los filtros
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {productos.map((p) => (
                <ProductCard key={p.id} p={p} />
              ))}
            </div>
          )}
          <div className="mt-7 text-[11px] text-ink/45">{productos.length} referencias encontradas</div>
        </div>
      </div>

      <div className="pb-12 text-center">
        <Link href="/cotizacion" className="text-[11px] font-bold tracking-[.1em] uppercase text-accent-dark">
          ¿Necesitas un dimensionamiento a medida? Solicita cotización técnica →
        </Link>
      </div>
    </Container>
  )
}

function FilterGroup({
  titulo,
  opciones,
  selected,
  onToggle,
  maxAltura,
}: {
  titulo: string
  opciones: { n: string; c?: number; value: string }[]
  selected: string[]
  onToggle: (value: string) => void
  maxAltura?: boolean
}) {
  if (opciones.length === 0) return null
  return (
    <div className="mb-5">
      <div className="text-[11px] font-black tracking-[.12em] uppercase pb-2.5 border-b border-ink/[.14] mb-3">
        {titulo}
      </div>
      <div className={`flex flex-col gap-2.5 ${maxAltura ? 'max-h-[260px] overflow-y-auto pr-1' : ''}`}>
        {opciones.map((o) => {
          const value = o.value
          const checked = selected.includes(value)
          return (
            <label
              key={o.n}
              className="flex gap-2.5 items-start text-[12.5px] leading-snug text-ink/80 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(value)}
                className="mt-0.5 accent-accent"
              />
              <span className="flex-1 min-w-0">{o.n}</span>
              {o.c !== undefined && <span className="text-ink/40 shrink-0">({o.c})</span>}
            </label>
          )
        })}
      </div>
    </div>
  )
}
