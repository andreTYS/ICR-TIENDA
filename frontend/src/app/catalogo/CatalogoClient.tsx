'use client'

import { useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import ProductCard from '@/components/ProductCard'
import Container from '@/components/Container'
import { CATEGORIAS_COMPONENTE, MARCAS, PRODUCTOS, SOLUCIONES, type SolucionId } from '@/data/products'

const APLICACIONES = [
  { id: 'b2b', label: 'Industrial / B2B' },
  { id: 'hogar', label: 'Hogar y negocio' },
  { id: 'offgrid', label: 'Off-grid' },
]

export default function CatalogoClient() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const solucion = (searchParams.get('solucion') as SolucionId | null) ?? null
  const q = searchParams.get('q') ?? ''

  const [categorias, setCategorias] = useState<string[]>(
    searchParams.get('cat') ? [searchParams.get('cat')!] : [],
  )
  const [marcas, setMarcas] = useState<string[]>([])
  const [aplicaciones, setAplicaciones] = useState<string[]>([])

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
      if (aplicaciones.length) {
        const match = aplicaciones.some((a) => {
          if (a === 'b2b') return p.b2b
          if (a === 'hogar') return !p.b2b
          if (a === 'offgrid') return p.soluciones.includes('offgrid')
          return false
        })
        if (!match) return false
      }
      return true
    })
  }, [q, solucion, categorias, marcas, aplicaciones])

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
        </button>
        {SOLUCIONES.map((s) => (
          <button
            key={s.id}
            onClick={() => setSolucion(s.id)}
            className={`font-heading text-[11px] font-bold tracking-[.08em] uppercase px-4 py-2.5 whitespace-nowrap border border-ink/20 hover:border-accent transition-colors ${
              solucion === s.id ? 'bg-ink text-white' : 'bg-transparent text-ink'
            }`}
          >
            {s.nombre}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-[260px_1fr] gap-6 items-start pb-16">
        <aside className="border border-ink/[.14] p-[18px] lg:sticky lg:top-[220px]">
          <FilterGroup
            titulo="Categoría"
            opciones={CATEGORIAS_COMPONENTE.map((c) => ({ n: c.nombre, c: c.n, value: c.nombre }))}
            selected={categorias}
            onToggle={(v) => toggle(categorias, setCategorias, v)}
          />
          <FilterGroup
            titulo="Marca"
            opciones={MARCAS.map((m) => ({ n: m, c: undefined, value: m }))}
            selected={marcas}
            onToggle={(v) => toggle(marcas, setMarcas, v)}
          />
          <FilterGroup
            titulo="Aplicación"
            opciones={APLICACIONES.map((a) => ({ n: a.label, c: undefined, value: a.id }))}
            selected={aplicaciones}
            onToggle={(v) => toggle(aplicaciones, setAplicaciones, v)}
          />
          <div className="text-[11px] font-black tracking-[.12em] uppercase pb-2.5 border-b border-ink/[.14] mb-3.5">
            Potencia (kW)
          </div>
          <div className="h-[3px] bg-ink/[.14] relative mb-2.5">
            <div className="absolute left-[12%] right-[34%] top-0 bottom-0 bg-accent" />
          </div>
          <div className="flex justify-between text-[11px] text-ink/50">
            <span>1,5 kW</span>
            <span>70 kW</span>
          </div>
        </aside>

        <div>
          {productos.length === 0 ? (
            <div className="text-center py-20 text-ink/50 text-sm">
              No hay productos que coincidan con los filtros seleccionados.
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
}: {
  titulo: string
  opciones: { n: string; c?: number; value: string }[]
  selected: string[]
  onToggle: (value: string) => void
}) {
  return (
    <div className="mb-5">
      <div className="text-[11px] font-black tracking-[.12em] uppercase pb-2.5 border-b border-ink/[.14] mb-3">
        {titulo}
      </div>
      <div className="flex flex-col gap-2.5">
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
