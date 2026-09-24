'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { money, stockLabel, titleCase, SOLUCIONES, type ProductoDetalle } from '@/data/products'
import { api } from '@/lib/api'
import { useQuote } from '@/context/QuoteContext'
import Container from '@/components/Container'
import ProductImage from '@/components/ProductImage'

const GARANTIAS = [
  'Garantía de fábrica con respaldo local de ICR',
  'Compatibilidad verificada por ingeniería antes del despacho',
  'Soporte y seguimiento postventa del sistema',
]

const TABS = [
  { id: 'ficha', label: 'Ficha técnica' },
  { id: 'envio', label: 'Envío y soporte' },
] as const

type TabId = (typeof TABS)[number]['id']

export default function Producto() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { add } = useQuote()
  const [tab, setTab] = useState<TabId>('ficha')
  const [qty, setQty] = useState(1)
  const [actual, setActual] = useState<ProductoDetalle | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    setActual(null)
    setError(false)
    setQty(1)
    api.producto(params.id).then(setActual).catch(() => setError(true))
  }, [params.id])

  if (error) {
    return (
      <Container className="py-24 text-center">
        <h1 className="text-2xl font-black uppercase mb-3">Producto no encontrado</h1>
        <p className="text-sm text-ink/60 mb-6">Puede que ya no esté disponible en la tienda.</p>
        <Link href="/catalogo" className="inline-block bg-ink text-white text-xs font-bold uppercase tracking-[.1em] px-6 py-4">
          Volver al catálogo
        </Link>
      </Container>
    )
  }

  if (!actual) {
    return (
      <Container className="pt-6 pb-16">
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="h-[420px] bg-surface animate-pulse" />
          <div className="flex flex-col gap-4">
            <div className="h-4 w-40 bg-surface animate-pulse" />
            <div className="h-10 w-full bg-surface animate-pulse" />
            <div className="h-24 w-full bg-surface animate-pulse" />
          </div>
        </div>
      </Container>
    )
  }

  const stock = stockLabel(actual)
  const soluciones = SOLUCIONES.filter((s) => actual.soluciones.includes(s.id))
  const tabData: Record<TabId, [string, string][]> = {
    ficha: [
      ['Marca', actual.marca || '—'],
      ['Referencia', actual.referencia_interna || `ICR-${actual.id}`],
      ['Categoría', titleCase(actual.categoria_producto)],
      ['Unidad de venta', titleCase(actual.unidad_medida) || 'Unidad'],
      ['Disponibilidad', stock.texto],
      ...(soluciones.length ? [['Soluciones', soluciones.map((s) => s.nombre).join(' · ')] as [string, string]] : []),
    ],
    envio: [
      ['Despacho', '48 h hábiles desde Arequipa'],
      ['Cobertura', 'Arequipa y sur del Perú'],
      ['Instalación', 'Red técnica certificada'],
      ['Soporte', 'Ingeniería postventa ICR'],
    ],
  }

  const cotizar = () => {
    add(actual, qty)
    router.push('/cotizacion')
  }

  return (
    <Container className="pt-6 pb-16">
      <div className="text-[11px] font-medium tracking-[.1em] uppercase text-ink/45 mb-5">
        <Link href="/catalogo">Tienda</Link> /{' '}
        <Link href={`/catalogo?cat=${encodeURIComponent(actual.categoria_producto || '')}`}>
          {titleCase(actual.categoria_producto)}
        </Link>{' '}
        / <span className="text-ink">{actual.marca || actual.referencia_interna || actual.nombre}</span>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 items-start">
        <div className="relative border border-ink/[.16] bg-surface h-[420px] flex items-center justify-center p-10">
          <ProductImage src={actual.imagen_url} alt={actual.nombre} />
          {actual.destacado && (
            <div className="absolute right-0 top-0 bg-accent text-ink font-black tracking-[.1em] uppercase text-xs px-3 py-2">
              Destacado
            </div>
          )}
        </div>

        <div>
          <div className="text-[11px] font-bold tracking-[.12em] uppercase text-accent-dark mb-2.5">
            {[actual.marca, actual.referencia_interna && `Ref. ${actual.referencia_interna}`].filter(Boolean).join(' · ') ||
              titleCase(actual.categoria_producto)}
          </div>
          <h1 className="text-[26px] sm:text-[30px] font-black leading-tight uppercase mb-4">{actual.nombre}</h1>
          <p className="text-sm leading-relaxed text-ink/70 mb-6">
            {actual.descripcion ||
              `Producto de la línea ${titleCase(actual.categoria_producto)}, disponible en Inversiones ICR. Nuestro equipo de ingeniería verifica la compatibilidad con tu sistema antes del despacho.`}
          </p>

          <div className="flex flex-wrap gap-6 items-end border-t border-b border-ink/[.14] py-5 mb-5">
            <div>
              <div className="text-[10.5px] font-medium tracking-[.12em] uppercase text-ink/45 mb-1.5">
                Precio público
              </div>
              <div className="text-[30px] font-black tracking-tight leading-none">{money(actual.precio_venta ?? 0)}</div>
              <div className="text-[11px] text-ink/45 mt-1.5">IGV incluido</div>
            </div>
            <div className="border-l border-ink/[.14] pl-6">
              <div className="text-[10.5px] font-medium tracking-[.12em] uppercase text-ink/45 mb-1.5 whitespace-nowrap">
                Stock en almacén
              </div>
              <div
                className={`text-[13px] font-bold ${
                  stock.tono === 'ok' ? 'text-emerald-700' : stock.tono === 'pedido' ? 'text-amber-700' : 'text-ink/60'
                }`}
              >
                {stock.texto}
              </div>
            </div>
            <div className="border-l border-ink/[.14] pl-6">
              <div className="text-[10.5px] font-medium tracking-[.12em] uppercase text-ink/45 mb-1.5 whitespace-nowrap">
                Proyecto / volumen
              </div>
              <div className="text-[13px] font-bold text-accent-dark">Precio por cotización</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5 mb-5">
            <div className="flex items-center border border-ink/25">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-10 h-full text-lg font-bold" aria-label="Menos">
                –
              </button>
              <span className="w-10 text-center font-bold">{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} className="w-10 h-full text-lg font-bold" aria-label="Más">
                +
              </button>
            </div>
            <button
              onClick={cotizar}
              className="border-0 bg-ink text-white font-heading text-xs font-black tracking-[.1em] uppercase px-6 py-4 hover:bg-accent-dark transition-colors"
            >
              Añadir a cotización
            </button>
            <button
              onClick={cotizar}
              className="border border-accent bg-transparent text-accent-dark font-heading text-xs font-bold tracking-[.1em] uppercase px-6 py-4 hover:bg-accent/10 transition-colors"
            >
              Comprar ahora
            </button>
          </div>

          <div className="flex flex-col gap-2 mb-6">
            {GARANTIAS.map((g) => (
              <div key={g} className="flex gap-2.5 text-[12.5px] text-ink/70">
                <span className="text-accent font-black">+</span>
                {g}
              </div>
            ))}
          </div>

          <div className="border border-ink/[.14]">
            <div className="flex border-b border-ink/[.14]">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex-1 border-0 font-heading text-[11px] font-bold tracking-[.1em] uppercase px-2.5 py-3.5 transition-colors ${
                    tab === t.id ? 'bg-ink text-white' : 'bg-transparent text-ink/60 hover:text-ink'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="px-[18px] pb-[18px]">
              {tabData[tab].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-[18px] py-3 border-b border-ink/10 last:border-b-0">
                  <span className="text-[11px] font-medium tracking-[.1em] uppercase text-ink/55">{k}</span>
                  <span className="text-[13px] font-bold text-right">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {actual.relacionados.length > 0 && (
        <div className="mt-14">
          <h2 className="kicker text-ink/55 mb-5">Compatibles y complementarios</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {actual.relacionados.map((p) => (
              <Link
                key={p.id}
                href={`/producto/${p.id}`}
                className="border border-ink/[.14] p-4 bg-white hover:border-accent transition-colors block"
              >
                <div className="h-28 bg-surface flex items-center justify-center p-3 mb-3.5">
                  <ProductImage src={p.imagen_url} alt={p.nombre} />
                </div>
                <div className="text-[10.5px] font-bold tracking-[.1em] uppercase text-accent-dark mb-1.5">
                  {p.marca || titleCase(p.categoria_producto)}
                </div>
                <div className="text-[13px] font-bold leading-tight mb-2 line-clamp-2">{p.nombre}</div>
                <div className="text-[15px] font-black">{money(p.precio_venta ?? 0)}</div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </Container>
  )
}
