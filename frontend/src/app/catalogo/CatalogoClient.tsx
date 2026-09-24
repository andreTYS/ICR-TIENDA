'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import ProductCard from '@/components/ProductCard'
import Container from '@/components/Container'
import { SOLUCIONES, titleCase, type SolucionId } from '@/data/products'
import { api, type Filtros, type ListaProductos } from '@/lib/api'

const ORDENES = [
  { id: '', label: 'Relevancia' },
  { id: 'precio_asc', label: 'Precio: menor a mayor' },
  { id: 'precio_desc', label: 'Precio: mayor a menor' },
  { id: 'nombre', label: 'Nombre A–Z' },
]
const PAGE_SIZE = 24
const VISIBLES = 10

export default function CatalogoClient() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // El estado de los filtros vive en la URL: se puede compartir y el botón atrás funciona
  const solucion = (searchParams.get('solucion') as SolucionId | null) ?? null
  const q = searchParams.get('q') ?? ''
  const categorias = searchParams.get('cat')?.split(',').filter(Boolean) ?? []
  const marcas = searchParams.get('marca')?.split(',').filter(Boolean) ?? []
  const sort = searchParams.get('sort') ?? ''
  const page = Math.max(parseInt(searchParams.get('page') ?? '1') || 1, 1)
  const min = searchParams.get('min') ?? ''
  const max = searchParams.get('max') ?? ''

  const [filtros, setFiltros] = useState<Filtros | null>(null)
  const [data, setData] = useState<ListaProductos | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [precio, setPrecio] = useState({ min, max })

  const setParams = (cambios: Record<string, string | null>, resetPage = true) => {
    const next = new URLSearchParams(searchParams.toString())
    for (const [k, v] of Object.entries(cambios)) {
      if (v) next.set(k, v)
      else next.delete(k)
    }
    if (resetPage) next.delete('page')
    router.push(`${pathname}?${next.toString()}`, { scroll: !resetPage })
  }

  const toggle = (key: 'cat' | 'marca', list: string[], value: string) => {
    const nueva = list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
    setParams({ [key]: nueva.join(',') || null })
  }

  useEffect(() => setPrecio({ min, max }), [min, max])

  useEffect(() => {
    api.filtros().then(setFiltros).catch(() => setFiltros({ categorias: [], marcas: [] }))
  }, [])

  const query = searchParams.toString()
  useEffect(() => {
    const params = new URLSearchParams(query)
    params.set('pageSize', String(PAGE_SIZE))
    setCargando(true)
    setError(null)
    api
      .productos(params)
      .then(setData)
      .catch(() => setError('No se pudo cargar el catálogo. Intenta de nuevo en unos segundos.'))
      .finally(() => setCargando(false))
  }, [query])

  const hayFiltros = categorias.length || marcas.length || q || min || max || solucion

  return (
    <Container className="pt-6">
      <div className="text-[11px] font-medium tracking-[.1em] uppercase text-ink/45 mb-4">
        Inicio / Tienda / <span className="text-ink">{q ? `Búsqueda: “${q}”` : 'Todos los productos'}</span>
      </div>
      <div className="flex flex-wrap gap-4 items-end justify-between border-b border-ink/[.14] pb-5">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black uppercase leading-none mb-2">Catálogo técnico</h1>
          <p className="text-[13px] text-ink/60 m-0">
            Precios en soles con IGV. Stock sincronizado con nuestro almacén. Para volumen o proyecto, solicita
            cotización.
          </p>
        </div>
        <label className="flex items-center gap-2 text-[11px] font-bold tracking-[.1em] uppercase text-ink/60">
          Ordenar
          <select
            value={sort}
            onChange={(e) => setParams({ sort: e.target.value || null })}
            className="border border-ink/20 px-2.5 py-2 text-[12px] font-medium normal-case tracking-normal text-ink bg-white"
          >
            {ORDENES.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap gap-2.5 py-5 overflow-x-auto">
        <button
          onClick={() => setParams({ solucion: null })}
          className={`font-heading text-[11px] font-bold tracking-[.08em] uppercase px-4 py-2.5 whitespace-nowrap border border-ink/20 hover:border-accent transition-colors ${
            !solucion ? 'bg-ink text-white' : 'bg-transparent text-ink'
          }`}
        >
          Todas las soluciones
        </button>
        {SOLUCIONES.map((s) => (
          <button
            key={s.id}
            onClick={() => setParams({ solucion: s.id })}
            className={`font-heading text-[11px] font-bold tracking-[.08em] uppercase px-4 py-2.5 whitespace-nowrap border border-ink/20 hover:border-accent transition-colors ${
              solucion === s.id ? 'bg-ink text-white' : 'bg-transparent text-ink'
            }`}
          >
            {s.nombre}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-[260px_1fr] gap-6 items-start pb-16">
        <aside className="border border-ink/[.14] p-[18px] lg:sticky lg:top-[220px] lg:max-h-[calc(100vh-240px)] lg:overflow-y-auto">
          {hayFiltros ? (
            <button
              onClick={() => router.push(pathname)}
              className="w-full mb-4 border border-ink/20 text-[11px] font-bold tracking-[.1em] uppercase py-2 hover:border-accent"
            >
              Limpiar filtros
            </button>
          ) : null}
          <FilterGroup
            titulo="Categoría"
            opciones={(filtros?.categorias ?? []).map((c) => ({ n: titleCase(c.nombre), c: c.n, value: c.nombre }))}
            selected={categorias}
            onToggle={(v) => toggle('cat', categorias, v)}
          />
          <FilterGroup
            titulo="Marca"
            opciones={(filtros?.marcas ?? []).map((m) => ({ n: m.nombre, c: m.n, value: m.nombre }))}
            selected={marcas}
            onToggle={(v) => toggle('marca', marcas, v)}
          />
          <div className="text-[11px] font-black tracking-[.12em] uppercase pb-2.5 border-b border-ink/[.14] mb-3.5">
            Precio (S/)
          </div>
          <form
            className="flex gap-2 items-center"
            onSubmit={(e) => {
              e.preventDefault()
              setParams({ min: precio.min || null, max: precio.max || null })
            }}
          >
            <input
              inputMode="numeric"
              placeholder="Mín"
              value={precio.min}
              onChange={(e) => setPrecio((p) => ({ ...p, min: e.target.value.replace(/\D/g, '') }))}
              className="w-full min-w-0 border border-ink/20 px-2 py-2 text-[12px]"
            />
            <input
              inputMode="numeric"
              placeholder="Máx"
              value={precio.max}
              onChange={(e) => setPrecio((p) => ({ ...p, max: e.target.value.replace(/\D/g, '') }))}
              className="w-full min-w-0 border border-ink/20 px-2 py-2 text-[12px]"
            />
            <button className="bg-ink text-white text-[11px] font-bold px-3 py-2">OK</button>
          </form>
        </aside>

        <div>
          {error ? (
            <div className="text-center py-20 text-ink/60 text-sm">{error}</div>
          ) : !data ? (
            <Esqueleto />
          ) : data.productos.length === 0 ? (
            <div className="text-center py-20 text-ink/50 text-sm">
              No hay productos que coincidan con los filtros seleccionados.
            </div>
          ) : (
            <div
              className={`grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 transition-opacity ${
                cargando ? 'opacity-50' : ''
              }`}
            >
              {data.productos.map((p) => (
                <ProductCard key={p.id} p={p} />
              ))}
            </div>
          )}
          {data && data.total > 0 && (
            <div className="mt-7 flex flex-wrap items-center justify-between gap-4">
              <div className="text-[11px] text-ink/45">
                {data.total} referencias · página {data.page} de {data.totalPages}
              </div>
              <Paginacion
                page={data.page}
                totalPages={data.totalPages}
                onPage={(n) => {
                  setParams({ page: n > 1 ? String(n) : null }, false)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
              />
            </div>
          )}
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

function Esqueleto() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="border border-ink/[.08] h-[340px] bg-surface animate-pulse" />
      ))}
    </div>
  )
}

function Paginacion({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (n: number) => void }) {
  if (totalPages <= 1) return null
  const paginas = Array.from(new Set([1, page - 1, page, page + 1, totalPages]))
    .filter((n) => n >= 1 && n <= totalPages)
    .sort((a, b) => a - b)
  const btn = 'min-w-[36px] h-9 px-2 border text-[12px] font-bold'
  return (
    <div className="flex gap-1.5 items-center">
      <button disabled={page <= 1} onClick={() => onPage(page - 1)} className={`${btn} border-ink/20 disabled:opacity-30`}>
        ‹
      </button>
      {paginas.map((n, i) => (
        <span key={n} className="flex gap-1.5 items-center">
          {i > 0 && n - paginas[i - 1] > 1 && <span className="text-ink/40">…</span>}
          <button
            onClick={() => onPage(n)}
            className={`${btn} ${n === page ? 'bg-ink text-white border-ink' : 'border-ink/20 hover:border-accent'}`}
          >
            {n}
          </button>
        </span>
      ))}
      <button
        disabled={page >= totalPages}
        onClick={() => onPage(page + 1)}
        className={`${btn} border-ink/20 disabled:opacity-30`}
      >
        ›
      </button>
    </div>
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
  const [todas, setTodas] = useState(false)
  // Las seleccionadas siempre visibles, aunque estén fuera de las primeras
  const visibles = todas
    ? opciones
    : opciones.filter((o, i) => i < VISIBLES || selected.includes(o.value))
  return (
    <div className="mb-5">
      <div className="text-[11px] font-black tracking-[.12em] uppercase pb-2.5 border-b border-ink/[.14] mb-3">
        {titulo}
      </div>
      <div className="flex flex-col gap-2.5">
        {visibles.map((o) => {
          const checked = selected.includes(o.value)
          return (
            <label
              key={o.value}
              className="flex gap-2.5 items-start text-[12.5px] leading-snug text-ink/80 cursor-pointer"
            >
              <input type="checkbox" checked={checked} onChange={() => onToggle(o.value)} className="mt-0.5 accent-accent" />
              <span className="flex-1 min-w-0">{o.n}</span>
              {o.c !== undefined && <span className="text-ink/40 shrink-0">({o.c})</span>}
            </label>
          )
        })}
      </div>
      {opciones.length > VISIBLES && (
        <button
          onClick={() => setTodas((t) => !t)}
          className="mt-3 text-[11px] font-bold tracking-[.08em] uppercase text-accent-dark"
        >
          {todas ? 'Ver menos' : `Ver todas (${opciones.length})`}
        </button>
      )}
    </div>
  )
}
